/**
 * Principal Dashboard Controller
 * Kandili Workspace - DepEd Burnout & Workload Management
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebarTracker();
    initLogoutHandler();
    initReportNavigation();
    initSimulationEngine();
    initDashboardCharts();
});

/* ==========================================================================
   1. Sidebar Active Anchor & Smooth Scroll Tracker
   ========================================================================== */
function initSidebarTracker() {
    const sidebarLinks = document.querySelectorAll('.app-sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

/* ==========================================================================
   2. Authentication & Logout Handler
   ========================================================================== */
function initLogoutHandler() {
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm("Are you sure you want to log out?")) {
            window.location.href = "../login.html";
        }
    });
}

/* ==========================================================================
   3. Faculty Audit & Diagnostic Reports Navigation
   ========================================================================== */
function initReportNavigation() {
    // 1. Workload Reports Directory
    const workloadBtn = document.getElementById('openWorkloadReportBtn');
    if (workloadBtn) {
        workloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'workload_reports_directory.html';
        });
    }

    // 2. Burnout Diagnostic Directory
    const burnoutBtn = document.getElementById('openBurnoutReportBtn');
    if (burnoutBtn) {
        burnoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'burnout_reports_directory.html';
        });
    }
}

/* ==========================================================================
   4. Workload Simulation & Reallocation Controls
   ========================================================================== */
const simulationState = {
    'row-sim-1': false,
    'row-sim-2': false,
    'row-sim-3': false
};

window.toggleRowSimulation = function (rowId, hoursDeduction) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const btn = row.querySelector('.action-btn--simulate');
    const jdcHoursElem = document.getElementById('jdc-current-hours');
    const apDeptScore = document.getElementById('ap-dept-score');
    const apDeptBar = document.getElementById('ap-dept-bar');

    simulationState[rowId] = !simulationState[rowId];

    if (simulationState[rowId]) {
        row.style.background = '#f0fdf4';
        if (btn) {
            btn.textContent = 'Simulated';
            btn.style.background = '#16a34a';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#16a34a';
        }
    } else {
        row.style.background = '#ffffff';
        if (btn) {
            btn.textContent = 'Simulate';
            btn.style.background = '#eff6ff';
            btn.style.color = '#0038A8';
            btn.style.borderColor = '#bfdbfe';
        }
    }

    // Calculate total simulated deductions
    let totalDeduction = 0;
    if (simulationState['row-sim-1']) totalDeduction += 8;
    if (simulationState['row-sim-2']) totalDeduction += 5;

    const newJdcHours = 48 - totalDeduction;
    if (jdcHoursElem) {
        jdcHoursElem.textContent = `${newJdcHours} hrs/wk`;
    }

    if (apDeptScore && apDeptBar) {
        const newApAvg = 48 - Math.round(totalDeduction / 2);
        if (newApAvg <= 40) {
            apDeptScore.textContent = `Avg: ${newApAvg} hrs (Compliant)`;
            apDeptScore.style.color = '#16a34a';
            apDeptBar.style.background = '#16a34a';
            apDeptBar.style.width = '65%';
        } else {
            apDeptScore.textContent = `Avg: ${newApAvg} hrs (Overloaded)`;
            apDeptScore.style.color = '#dc2626';
            apDeptBar.style.background = '#dc2626';
            apDeptBar.style.width = '80%';
        }
    }
};

window.applyAllSimulations = function () {
    ['row-sim-1', 'row-sim-2', 'row-sim-3'].forEach(id => {
        if (!simulationState[id]) {
            const hours = id === 'row-sim-1' ? 8 : (id === 'row-sim-2' ? 5 : 6);
            window.toggleRowSimulation(id, hours);
        }
    });
    alert("Simulator state applied across department rosters.");
};

window.exportSimulationReport = function () {
    window.location.href = 'workload_report.html?code=TCH-012';
};

window.sendIndividualCheckIn = function (teacherCode) {
    alert(`Pulse check-in reminder dispatched to ${teacherCode}.`);
};

window.sendBulkPulseReminders = function () {
    alert("Automated reminders dispatched to all 3 pending faculty members.");
};

/* ==========================================================================
   5. Chart Visualizations
   ========================================================================== */
function initDashboardCharts() {
    // Chart 1: Workload vs Exhaustion Scatter / Bubble
    const workloadCanvas = document.getElementById('workloadChart');
    if (workloadCanvas && typeof Chart !== 'undefined') {
        new Chart(workloadCanvas, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Compliant Load',
                        data: [
                            { x: 28, y: 12 }, { x: 32, y: 15 }, { x: 35, y: 18 },
                            { x: 36, y: 14 }, { x: 38, y: 22 }, { x: 39, y: 20 }
                        ],
                        backgroundColor: '#0038A8'
                    },
                    {
                        label: 'High Exhaustion / Overload',
                        data: [
                            { x: 44, y: 28 }, { x: 47, y: 31 }, { x: 48, y: 34 }
                        ],
                        backgroundColor: '#C8102E'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Total Workload Units (WLU / Hours)' },
                        min: 20,
                        max: 55
                    },
                    y: {
                        title: { display: true, text: 'MBI Emotional Exhaustion (EE Score)' },
                        min: 0,
                        max: 40
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Chart 2: Burnout Risk Distribution
    const distributionCanvas = document.getElementById('distributionChart');
    if (distributionCanvas && typeof Chart !== 'undefined') {
        new Chart(distributionCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Moderate Strain', 'Critical Burnout'],
                datasets: [{
                    data: [21, 5, 2],
                    backgroundColor: ['#059669', '#f59e0b', '#dc2626'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15, font: { size: 12 } }
                    }
                },
                cutout: '70%'
            }
        });
    }
}