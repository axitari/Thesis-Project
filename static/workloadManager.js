// static/workloadManager.js

/**
 * Kandili Workload Analytics Engine
 * Calculates teaching loads, ancillary duties, total weekly hours, and risk classification.
 */

// 1. Calculate workload summary for a single teacher
async function getTeacherWorkloadSummary(teacherId, schoolYear = '2025-2026') {
    if (!teacherId || !window.supabaseClient) return null;

    try {
        // Fetch teaching loads (in minutes)
        const { data: teachingData, error: tErr } = await window.supabaseClient
            .from('teaching_loads')
            .select('minutes_per_week')
            .eq('teacher_id', teacherId)
            .eq('school_year', schoolYear);

        if (tErr) throw tErr;

        // Fetch ancillary duties (in hours)
        const { data: ancillaryData, error: aErr } = await window.supabaseClient
            .from('ancillary_duties')
            .select('hours_per_week')
            .eq('teacher_id', teacherId)
            .eq('school_year', schoolYear);

        if (aErr) throw aErr;

        // Sum total teaching minutes -> convert to hours
        const totalTeachingMinutes = (teachingData || []).reduce((sum, item) => sum + (item.minutes_per_week || 0), 0);
        const teachingHours = totalTeachingMinutes / 60;

        // Sum total ancillary hours
        const ancillaryHours = (ancillaryData || []).reduce((sum, item) => sum + (parseFloat(item.hours_per_week) || 0), 0);

        // Compute Total Workload Hours
        const totalHours = Math.round((teachingHours + ancillaryHours) * 10) / 10; // Round to 1 decimal

        // Classify Status based on R.A. 4670 40-hour limit
        let status = 'optimal'; // Default
        let riskScore = Math.min(Math.round((totalHours / 40) * 100), 100);

        if (totalHours > 40) {
            status = 'overloaded';
            riskScore = Math.min(85 + Math.round((totalHours - 40) * 3), 100); // 85-100 scale for overloaded
        } else if (totalHours > 36) {
            status = 'maximized';
            riskScore = 60 + Math.round((totalHours - 36) * 5); // 60-80 scale for maximized
        } else {
            status = 'optimal';
            riskScore = Math.round((totalHours / 36) * 50); // 0-50 scale for optimal
        }

        return {
            teacherId,
            teachingMinutes: totalTeachingMinutes,
            teachingHours: Math.round(teachingHours * 10) / 10,
            ancillaryHours: Math.round(ancillaryHours * 10) / 10,
            totalHours,
            status,
            riskScore
        };

    } catch (err) {
        console.error(`Failed to calculate workload for teacher ${teacherId}:`, err);
        return null;
    }
}

// 2. Aggregate workloads for ALL teachers (Used by Principal/Admin Dashboards)
async function getFacultyWorkloadOverview(schoolYear = '2025-2026') {
    if (!window.supabaseClient) return null;

    try {
        // Fetch all teachers
        const { data: teachers, error: profileErr } = await window.supabaseClient
            .from('profiles')
            .select('id, first_name, last_name, department, role')
            .eq('role', 'teacher');

        if (profileErr) throw profileErr;

        const overview = {
            optimal: [],
            maximized: [],
            overloaded: [],
            all: []
        };

        // Process each teacher concurrently
        const workloadPromises = teachers.map(async (teacher) => {
            const summary = await getTeacherWorkloadSummary(teacher.id, schoolYear);
            const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || `Teacher (${teacher.id.substring(0, 5)})`;

            const fullRecord = {
                ...teacher,
                fullName,
                workload: summary || {
                    teachingMinutes: 0,
                    teachingHours: 0,
                    ancillaryHours: 0,
                    totalHours: 0,
                    status: 'optimal',
                    riskScore: 0
                }
            };

            overview.all.push(fullRecord);
            if (fullRecord.workload.status === 'overloaded') {
                overview.overloaded.push(fullRecord);
            } else if (fullRecord.workload.status === 'maximized') {
                overview.maximized.push(fullRecord);
            } else {
                overview.optimal.push(fullRecord);
            }
        });

        await Promise.all(workloadPromises);
        return overview;

    } catch (err) {
        console.error("Failed to generate faculty workload overview:", err);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', loadOfficialClassProgramView);

// Render Official DepEd Class Program Template on classprogram.html
async function loadOfficialClassProgramView() {
    const sectionNameEl = document.getElementById('section-name');
    const schoolYearEl = document.getElementById('school-year');
    const totalMinutesEl = document.getElementById('total-minutes');
    const demographicsEl = document.getElementById('demographics');
    const matrixBodyEl = document.getElementById('matrix-body');
    const teacherNameEl = document.getElementById('teacher-name');
    const principalNameEl = document.getElementById('principal-name');

    if (!matrixBodyEl) return;

    // 1. Fetch Session & User Details
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', session.user.id)
            .single();

        if (profile && teacherNameEl) {
            const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toUpperCase();
            teacherNameEl.textContent = name || 'DOCTOR BROWN';
        }

        // Dynamic Principal Name Resolution from public.profiles
        const { data: principalProfile } = await window.supabaseClient
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('role', 'principal')
            .limit(1)
            .maybeSingle();

        if (principalNameEl) {
            if (principalProfile && (principalProfile.first_name || principalProfile.last_name)) {
                const fullPrincipalName = `${principalProfile.first_name || ''} ${principalProfile.last_name || ''}`.trim().toUpperCase();
                principalNameEl.textContent = fullPrincipalName;
            } else {
                const savedPrincipal = localStorage.getItem('kandili_principal_name');
                principalNameEl.textContent = savedPrincipal ? savedPrincipal.toUpperCase() : '(Principal Name)';
            }
        }
    }

    // 2. Read Extracted Class Program Data
    let data = null;
    try {
        const stored = localStorage.getItem('kandili_extracted_class_program');
        if (stored) data = JSON.parse(stored);
    } catch(e){}

    const defaultData = {
        section: 'Grade 2 - A',
        schoolYear: '2026 - 2027',
        totalMinutes: 375,
        male: 22,
        female: 20,
        total: 42,
        scheduleMatrix: [
            { time: '07:30 - 08:30 AM', min: 60, mon: 'English', tue: 'English', wed: 'English', thu: 'English', fri: 'English' },
            { time: '08:30 - 09:30 AM', min: 60, mon: 'Mathematics', tue: 'Mathematics', wed: 'Mathematics', thu: 'Mathematics', fri: 'Mathematics' },
            { time: '09:30 - 09:45 AM', min: 15, mon: 'Recess', tue: 'Recess', wed: 'Recess', thu: 'Recess', fri: 'Recess' },
            { time: '09:45 - 10:45 AM', min: 60, mon: 'Science', tue: 'Science', wed: 'Science', thu: 'Science', fri: 'Science' },
            { time: '10:45 - 11:45 AM', min: 60, mon: 'Filipino', tue: 'Filipino', wed: 'Filipino', thu: 'Filipino', fri: 'Filipino' },
            { time: '01:00 - 02:00 PM', min: 60, mon: 'Araling Panlipunan', tue: 'Araling Panlipunan', wed: 'Araling Panlipunan', thu: 'Araling Panlipunan', fri: 'Araling Panlipunan' },
            { time: '02:00 - 03:00 PM', min: 60, mon: 'MAPEH', tue: 'MAPEH', wed: 'MAPEH', thu: 'MAPEH', fri: 'MAPEH' }
        ]
    };

    const finalData = data || defaultData;

    if (sectionNameEl) sectionNameEl.textContent = `Section: ${finalData.section || 'Grade 2 - A'}`;
    if (schoolYearEl) schoolYearEl.textContent = `School Year ${finalData.schoolYear || '2026 - 2027'}`;
    if (totalMinutesEl) totalMinutesEl.textContent = `Total minutes per day: ${finalData.totalMinutes || 375} min`;
    if (demographicsEl) demographicsEl.innerHTML = `Male: <strong>${finalData.male || 22}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Female: <strong>${finalData.female || 20}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Total: <strong>${finalData.total || 42}</strong>`;

    // Render Matrix Rows
    matrixBodyEl.innerHTML = '';
    const matrix = finalData.scheduleMatrix || defaultData.scheduleMatrix;

    matrix.forEach(row => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom: 1px solid #cbd5e1; font-size: 0.9rem; text-align: center;';
        
        const isRecess = (row.mon || '').toLowerCase().includes('recess');
        if (isRecess) {
            tr.style.background = '#f8fafc';
            tr.style.fontWeight = '600';
            tr.style.color = '#64748b';
        }

        tr.innerHTML = `
            <td style="padding: 0.75rem; font-weight: 600; color: #0f172a;">${row.time}</td>
            <td style="padding: 0.75rem; color: #64748b;">${row.min}</td>
            <td style="padding: 0.75rem;">${row.mon}</td>
            <td style="padding: 0.75rem;">${row.tue}</td>
            <td style="padding: 0.75rem;">${row.wed}</td>
            <td style="padding: 0.75rem;">${row.thu}</td>
            <td style="padding: 0.75rem;">${row.fri}</td>
        `;
        matrixBodyEl.appendChild(tr);
    });
}