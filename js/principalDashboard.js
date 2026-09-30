/**
 * Principal Dashboard Controller
 * Kandili Workspace - DepEd Burnout & Workload Management
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebarTracker();
    initLogoutHandler();
    initNavigationListeners();
    initSimulationEngine();
    initHotlistActions();
    initPulseControls();
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
   3. Card Roster & Report Navigation
   ========================================================================== */
function initNavigationListeners() {
    // Refresh Top Nav Button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });

    // Workload Summary Tiers Navigation
    document.getElementById('btnViewUnderload')?.addEventListener('click', () => {
        window.location.href = '../admin/underload_teachers.html';
    });
    document.getElementById('btnViewOptimal')?.addEventListener('click', () => {
        window.location.href = '../admin/optimal_teachers.html';
    });
    document.getElementById('btnViewHighLoad')?.addEventListener('click', () => {
        window.location.href = '../admin/high-load_teachers.html';
    });
    document.getElementById('btnViewOverload')?.addEventListener('click', () => {
        window.location.href = '../admin/overload_teachers.html';
    });

    // Burnout Risk Cards Navigation
    document.getElementById('btnViewLowBurnout')?.addEventListener('click', () => {
        window.location.href = '../admin/low_burnout_teachers.html';
    });
    document.getElementById('btnViewModBurnout')?.addEventListener('click', () => {
        window.location.href = '../admin/moderate_burnout_teachers.html';
    });
    document.getElementById('btnViewHighBurnout')?.addEventListener('click', () => {
        window.location.href = '../admin/high_burnout_teachers.html';
    });

    // Reports Management Directories
    document.getElementById('openWorkloadReportBtn')?.addEventListener('click', () => {
        window.location.href = 'workload_reports_directory.html';
    });
    document.getElementById('openBurnoutReportBtn')?.addEventListener('click', () => {
        window.location.href = 'burnout_reports_directory.html';
    });

    // Hidden Strain Flag Link
    document.getElementById('btnInspectHiddenStrain')?.addEventListener('click', () => {
        window.location.href = '../admin/moderate_burnout_teachers.html';
    });
}

/* ==========================================================================
   4. Workload Simulation & Reallocation Controls
   ========================================================================== */
const simulationState = {
    'row-sim-1': false,
    'row-sim-2': false,
    'row-sim-3': false
};

function toggleRowSimulation(rowId, hoursDeduction) {
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
}

function applyAllSimulations() {
    ['row-sim-1', 'row-sim-2', 'row-sim-3'].forEach(id => {
        if (!simulationState[id]) {
            const hours = id === 'row-sim-1' ? 8 : (id === 'row-sim-2' ? 5 : 6);
            toggleRowSimulation(id, hours);
        }
    });
    alert("Simulator state applied across department rosters.");
}

function exportSimulationReport() {
    window.location.href = 'workload_report.html?code=TCH-012';
}

function initSimulationEngine() {
    // Row simulation button listener (delegated)
    document.querySelectorAll('.action-btn--simulate').forEach(btn => {
        btn.addEventListener('click', function () {
            const rowId = this.getAttribute('data-row-id');
            const hours = parseInt(this.getAttribute('data-hours'), 10) || 0;
            if (rowId) {
                toggleRowSimulation(rowId, hours);
            }
        });
    });

    // Apply All button
    document.getElementById('btnApplyAllSimulations')?.addEventListener('click', applyAllSimulations);

    // Export Plan button
    document.getElementById('btnExportSimulationReport')?.addEventListener('click', exportSimulationReport);
}

// Global scope export for backwards compatibility
window.toggleRowSimulation = toggleRowSimulation;
window.applyAllSimulations = applyAllSimulations;
window.exportSimulationReport = exportSimulationReport;

/* ==========================================================================
   5. Hotlist Actions & Pulse Reminders
   ========================================================================== */
function initHotlistActions() {
    // Diagnostic Buttons
    document.querySelectorAll('.btn-hotlist-diag').forEach(btn => {
        btn.addEventListener('click', function () {
            window.location.href = '../admin/high_burnout_teachers.html';
        });
    });

    // Check-in Buttons
    document.querySelectorAll('.btn-hotlist-checkin').forEach(btn => {
        btn.addEventListener('click', function () {
            const code = this.getAttribute('data-code') || 'Faculty Member';
            alert(`Pulse check-in reminder dispatched to ${code}.`);
        });
    });
}

function initPulseControls() {
    document.getElementById('btnSendBulkReminders')?.addEventListener('click', () => {
        alert("Automated reminders dispatched to all 3 pending faculty members.");
    });

    document.getElementById('btnExportChartData')?.addEventListener('click', () => {
        alert("Workload and burnout scatter dataset exported to CSV.");
    });
}

/* ==========================================================================
   6. Chart Visualizations
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