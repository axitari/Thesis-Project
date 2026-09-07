/* ============================================================ */
/* DIVISION SUPER ADMIN - ANALYTICS & GOVERNANCE CONTROLLER      */
/* ============================================================ */

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

// Chart.js Rendering for Multi-School Analytics
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Campus Teaching Load Comparison (Bar Chart)
    const ctxLoad = document.getElementById('schoolLoadChart');
    if (ctxLoad) {
        new Chart(ctxLoad, {
            type: 'bar',
            data: {
                labels: ['West Visayas CS', 'Iloilo NHS', 'Jaro NHS', 'La Paz CS'],
                datasets: [
                    {
                        label: 'Avg Teaching Hours (hrs/wk)',
                        data: [24.5, 27.8, 19.2, 21.0],
                        backgroundColor: '#0038A8'
                    },
                    {
                        label: 'Avg Ancillary Load (hrs/wk)',
                        data: [6.5, 8.2, 4.0, 5.1],
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
                        max: 35,
                        title: { display: true, text: 'Hours per Week' }
                    }
                }
            }
        });
    }

    // 2. Division Burnout Risk Classification (Doughnut Chart)
    const ctxRisk = document.getElementById('burnoutRiskChart');
    if (ctxRisk) {
        new Chart(ctxRisk, {
            type: 'doughnut',
            data: {
                labels: ['Optimal / Low Risk', 'Moderate Load', 'High Burnout Risk'],
                datasets: [{
                    data: [124, 40, 18],
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
    }
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