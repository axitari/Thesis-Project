// static/workloadManager.js

document.addEventListener('DOMContentLoaded', () => {
    const teachingLoadForm = document.getElementById('teachingLoadForm');

    if (teachingLoadForm) {
        teachingLoadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Get user session
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            // 2. Gather values
            const subject = document.getElementById('subjectCategory').value;
            const minutes = parseInt(document.getElementById('minutesPerWeek').value);

            // 3. Insert into Supabase 'teaching_loads' table
            const { error } = await window.supabaseClient
                .from('teaching_loads')
                .insert([
                    { 
                        teacher_id: session.user.id, 
                        subject_category: subject,
                        grade_level: subject, 
                        minutes_per_week: minutes 
                    }
                ]);

            if (error) {
                alert("Error adding class: " + error.message);
            } else {
                alert("Class added successfully!");
                location.reload(); // Refresh to update the UI
            }
        });
    }

    loadOfficialClassProgramView();
});

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