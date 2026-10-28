/* ============================================================ */
/* DIVISION SUPER ADMIN - ANALYTICS & GOVERNANCE CONTROLLER      */
/* ============================================================ */

let schoolLoadChartInstance = null;
let burnoutRiskChartInstance = null;

function switchView(tabName) {
    const analyticsSection = document.getElementById('analyticsSection');
    const accountsSection = document.getElementById('accountsSection');
    const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
    const tabAccountsBtn = document.getElementById('tabAccountsBtn');

    if (tabName === 'analytics') {
        analyticsSection.classList.remove('hidden');
        accountsSection.classList.add('hidden');
        tabAnalyticsBtn.classList.add('active');
        tabAccountsBtn.classList.remove('active');
    } else {
        analyticsSection.classList.add('hidden');
        accountsSection.classList.remove('hidden');
        tabAnalyticsBtn.classList.remove('active');
        tabAccountsBtn.classList.add('active');
    }
}

// Interactive School Audit Modal
function viewSchoolDetail(name, id, faculty, teachingLoad, ancillaryLoad, highRisk) {
    document.getElementById('auditSchoolName').textContent = name;
    document.getElementById('auditSchoolId').textContent = `DepEd ID: ${id}`;
    document.getElementById('auditFacultyCount').textContent = `${faculty} Faculty Members`;
    document.getElementById('auditTeachingHours').textContent = teachingLoad;
    document.getElementById('auditAncillaryHours').textContent = ancillaryLoad;
    document.getElementById('auditHighRisk').textContent = highRisk;

    document.getElementById('schoolAuditModal').classList.remove('hidden');
}

function closeAuditModal() {
    document.getElementById('schoolAuditModal').classList.add('hidden');
}

/**
 * 1. Campus Teaching & Ancillary Load Comparison (Bar Chart)
 * Groups teacher profiles by assigned_institution and calculates real averages.
 */
async function renderSchoolLoadChart() {
    const ctxLoad = document.getElementById('schoolLoadChart');
    if (!ctxLoad) return;

    try {
        if (!window.supabaseClient) {
            console.error('[superAdmin] Supabase client is not initialized.');
            return;
        }

        const { data: teachers, error } = await window.supabaseClient
            .from('profiles')
            .select(`
                id,
                assigned_institution,
                teaching_loads ( minutes_per_week ),
                ancillary_duties ( hours_per_week )
            `)
            .eq('role', 'teacher');

        if (error || !teachers || teachers.length === 0) {
            ctxLoad.parentElement.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:220px; color:#94a3b8; font-size:0.9rem; font-weight:500;">No data available yet.</div>`;
            return;
        }

        // Group by campus / school
        const schoolGroups = {};
        teachers.forEach(teacher => {
            const schoolName = (teacher.assigned_institution || '').trim();
            if (!schoolName) return;

            if (!schoolGroups[schoolName]) {
                schoolGroups[schoolName] = {
                    teacherCount: 0,
                    totalTeachingHours: 0,
                    totalAncillaryHours: 0
                };
            }

            const tMins = (teacher.teaching_loads || []).reduce((sum, l) => sum + (l.minutes_per_week || 0), 0);
            const tHours = tMins / 60;
            const aHours = (teacher.ancillary_duties || []).reduce((sum, d) => sum + parseFloat(d.hours_per_week || 0), 0);

            schoolGroups[schoolName].teacherCount += 1;
            schoolGroups[schoolName].totalTeachingHours += tHours;
            schoolGroups[schoolName].totalAncillaryHours += aHours;
        });

        const schoolNames = Object.keys(schoolGroups);
        if (schoolNames.length === 0) {
            ctxLoad.parentElement.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:220px; color:#94a3b8; font-size:0.9rem; font-weight:500;">No data available yet.</div>`;
            return;
        }

        const avgTeaching = schoolNames.map(name => {
            const group = schoolGroups[name];
            return parseFloat((group.totalTeachingHours / (group.teacherCount || 1)).toFixed(1));
        });

        const avgAncillary = schoolNames.map(name => {
            const group = schoolGroups[name];
            return parseFloat((group.totalAncillaryHours / (group.teacherCount || 1)).toFixed(1));
        });

        if (schoolLoadChartInstance) {
            schoolLoadChartInstance.destroy();
        }

        schoolLoadChartInstance = new Chart(ctxLoad.getContext('2d'), {
            type: 'bar',
            data: {
                labels: schoolNames,
                datasets: [
                    {
                        label: 'Avg Teaching Hours (hrs/wk)',
                        data: avgTeaching,
                        backgroundColor: '#0038A8'
                    },
                    {
                        label: 'Avg Ancillary Load (hrs/wk)',
                        data: avgAncillary,
                        backgroundColor: '#f59e0b'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Hours per Week' }
                    }
                }
            }
        });
    } catch (err) {
        console.error('[superAdmin] Error rendering school load chart:', err);
        ctxLoad.parentElement.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:220px; color:#94a3b8; font-size:0.9rem; font-weight:500;">No data available yet.</div>`;
    }
}

/**
 * 2. Division Burnout Risk Classification (Doughnut Chart)
 * Queries burnout_assessments and categorizes High (>70), Moderate (40-70), and Low (<40).
 */
async function renderBurnoutRiskChart() {
    const ctxRisk = document.getElementById('burnoutRiskChart');
    if (!ctxRisk) return;

    try {
        if (!window.supabaseClient) {
            console.error('[superAdmin] Supabase client is not initialized.');
            return;
        }

        const { data: assessments, error } = await window.supabaseClient
            .from('burnout_assessments')
            .select('risk_index');

        if (error || !assessments || assessments.length === 0) {
            ctxRisk.parentElement.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:220px; color:#94a3b8; font-size:0.9rem; font-weight:500;">No data available yet.</div>`;
            return;
        }

        let highCount = 0;
        let moderateCount = 0;
        let lowCount = 0;

        assessments.forEach(item => {
            const risk = parseFloat(item.risk_index || 0);
            if (risk > 70) highCount++;
            else if (risk >= 40) moderateCount++;
            else lowCount++;
        });

        const highRiskStat = document.getElementById('statHighRisk');
        if (highRiskStat) {
            highRiskStat.textContent = `${highCount} Teacher${highCount === 1 ? '' : 's'}`;
        }

        if (burnoutRiskChartInstance) {
            burnoutRiskChartInstance.destroy();
        }

        burnoutRiskChartInstance = new Chart(ctxRisk.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Optimal / Low Risk', 'Moderate Load', 'High Burnout Risk'],
                datasets: [{
                    data: [lowCount, moderateCount, highCount],
                    backgroundColor: ['#16a34a', '#f59e0b', '#dc2626']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (err) {
        console.error('[superAdmin] Error rendering burnout risk chart:', err);
        ctxRisk.parentElement.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:220px; color:#94a3b8; font-size:0.9rem; font-weight:500;">No data available yet.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await renderSchoolLoadChart();
    await renderBurnoutRiskChart();
});

/* Sidebar Collapsing & Navigation Actions */
function toggleSidebar() {
    const sidebar = document.getElementById('workspaceSidebar');
    if (window.innerWidth <= 900) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function switchSidebarView(viewName, element) {
    // Update active nav-item class
    document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    // Toggle views
    const analytics = document.getElementById('analyticsSection');
    const accounts = document.getElementById('accountsSection');

    if (viewName === 'analytics') {
        if (analytics) analytics.classList.remove('hidden');
        if (accounts) accounts.classList.add('hidden');
    } else if (viewName === 'accounts') {
        if (analytics) analytics.classList.add('hidden');
        if (accounts) accounts.classList.remove('hidden');
    }
}