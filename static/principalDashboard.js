// static/principalDashboard.js

let workloadChartInstance = null;
let distributionChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authorization
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('principal');
    }

    // 2. Fetch & Render Data
    await loadPrincipalDashboardData();

    // 3. UI Event Listeners
    setupNavigationEvents();
    setupDirectorySearch();
});

function setupNavigationEvents() {
    // Refresh Button
    const refreshBtn = document.querySelector('.theme-nav__refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Refreshing...`;
            await loadPrincipalDashboardData();
            refreshBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Refresh`;
        });
    }

    // Burger Menu
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    const themeNavMenu = document.getElementById('themeNavMenu');

    if (burgerMenuBtn && themeNavMenu) {
        burgerMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = themeNavMenu.classList.toggle('active');
            burgerMenuBtn.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!themeNavMenu.contains(event.target) && !burgerMenuBtn.contains(event.target)) {
                themeNavMenu.classList.remove('active');
                burgerMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof kandiliLogout === 'function') kandiliLogout();
        });
    }

    // Risk Filter Buttons
    const riskButtons = document.querySelectorAll('.risk-card-btn');
    riskButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            if (typeof showTeacherList === 'function') {
                showTeacherList(filter);
            }
        });
    });
}

async function loadPrincipalDashboardData() {
    try {
        const { data: teachers, error } = await window.supabaseClient
            .from('profiles')
            .select(`
                id,
                first_name,
                last_name,
                department,
                role,
                teaching_loads ( minutes_per_week ),
                ancillary_duties ( hours_per_week )
            `)
            .eq('role', 'teacher');

        if (error) {
            console.error("Error fetching principal dashboard data:", error.message);
            return;
        }

        let totalSchoolTeachingMins = 0;
        let totalSchoolAncillaryHrs = 0;
        let overloadedCount = 0;
        let maximizedCount = 0;
        let optimalCount = 0;

        const processedTeachers = teachers.map((teacher, index) => {
            const teachingMins = teacher.teaching_loads?.reduce((sum, item) => sum + (item.minutes_per_week || 0), 0) || 0;
            const teachingHrs = teachingMins / 60;
            const ancillaryHrs = teacher.ancillary_duties?.reduce((sum, item) => sum + parseFloat(item.hours_per_week || 0), 0) || 0;
            
            const totalLoadHrs = parseFloat((teachingHrs + ancillaryHrs).toFixed(1));

            totalSchoolTeachingMins += teachingMins;
            totalSchoolAncillaryHrs += ancillaryHrs;

            // Normalized to OVERLOADED for consistency
            let status = 'OPTIMAL';
            if (totalLoadHrs > 40) {
                status = 'OVERLOADED';
                overloadedCount++;
            } else if (totalLoadHrs > 36) {
                status = 'MAXIMIZED';
                maximizedCount++;
            } else {
                optimalCount++;
            }

            return {
                ...teacher,
                teacherCode: `TCH2026-${String(index + 1).padStart(3, '0')}`,
                fullName: `${teacher.last_name || ''}, ${teacher.first_name || 'Teacher'}`,
                totalLoadHrs,
                status
            };
        });

        updatePrincipalSummaryCards({
            totalTeachers: teachers.length,
            totalTeachingHrs: (totalSchoolTeachingMins / 60).toFixed(1),
            totalAncillaryHrs: totalSchoolAncillaryHrs.toFixed(1),
            overloadedCount,
            maximizedCount,
            optimalCount
        });

        renderPrincipalFacultyTable(processedTeachers);

        renderPrincipalCharts(processedTeachers, {
            overloadedCount,
            maximizedCount,
            optimalCount
        });

    } catch (err) {
        console.error("Failed to render principal workspace:", err);
    }
}

function renderPrincipalCharts(teachers, metrics) {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    const distCanvas = document.getElementById('distributionChart');
    if (distCanvas) {
        if (distributionChartInstance) distributionChartInstance.destroy();

        distributionChartInstance = new Chart(distCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Optimal Load (≤36h)', 'Maximized Load (36-40h)', 'Overloaded (>40h)'],
                datasets: [{
                    label: 'Teachers Count',
                    data: [metrics.optimalCount, metrics.maximizedCount, metrics.overloadedCount],
                    backgroundColor: ['#0038A8', '#f59e0b', '#C8102E'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const scatterCanvas = document.getElementById('workloadChart');
    if (scatterCanvas) {
        if (workloadChartInstance) workloadChartInstance.destroy();

        const scatterPoints = teachers.map(t => {
            const load = parseFloat(t.totalLoadHrs);
            let state = 'Optimal';
            if (load > 40) state = 'Overloaded';
            else if (load > 36) state = 'Maximized';

            return {
                x: load,
                y: Math.min(100, Math.round((load / 40) * 80)),
                state: state,
                name: t.fullName
            };
        });

        workloadChartInstance = new Chart(scatterCanvas.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Teachers',
                    data: scatterPoints.length > 0 ? scatterPoints : [],
                    backgroundColor: function(context) {
                        const state = context.raw?.state;
                        if (state === 'Overloaded') return '#C8102E';
                        if (state === 'Maximized') return '#f59e0b';
                        return '#0038A8';
                    },
                    pointRadius: 7,
                    pointHoverRadius: 9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const pt = ctx.raw;
                                return `${pt.name || 'Teacher'}: Workload ${pt.x} hrs | Exhaustion ${pt.y}% (${pt.state})`;
                            }
                        }
                    }
                },
                scales: {
                    y: { title: { display: true, text: 'Exhaustion Score (%)' }, min: 0, max: 100 },
                    x: { title: { display: true, text: 'Workload (Hours / Week)' }, min: 0, max: 55 }
                }
            }
        });
    }
}

function updatePrincipalSummaryCards(metrics) {
    const teacherCountEl = document.querySelector('.metric-card--teachers .metric-value');
    const teachingHrsEl = document.querySelector('.metric-card--teaching .metric-value');
    const ancillaryHrsEl = document.querySelector('.metric-card--ancillary .metric-value');

    if (teacherCountEl) teacherCountEl.innerText = metrics.totalTeachers;
    if (teachingHrsEl) teachingHrsEl.innerText = `${metrics.totalTeachingHrs} hrs`;
    if (ancillaryHrsEl) ancillaryHrsEl.innerText = `${metrics.totalAncillaryHrs} hrs`;

    const overloadedEl = document.querySelector('.risk-card--critical .risk-card-number');
    const maximizedEl = document.querySelector('.risk-card--moderate .risk-card-number');
    const optimalEl = document.querySelector('.risk-card--low .risk-card-number');

    if (overloadedEl) overloadedEl.innerText = metrics.overloadedCount;
    if (maximizedEl) maximizedEl.innerText = metrics.maximizedCount;
    if (optimalEl) optimalEl.innerText = metrics.optimalCount;
}

function renderPrincipalFacultyTable(teachers) {
    // Isolated target to prevent overwriting the reallocation table
    const tableBody = document.querySelector('#facultyTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';

        if (teachers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem;">No registered faculty profiles found.</td></tr>`;
        } else {
            teachers.forEach(teacher => {
                let statusBadge = `<span class="status-pending">OPTIMAL</span>`;
                if (teacher.status === 'OVERLOADED') {
                    statusBadge = `<span class="status-overload">OVERLOADED</span>`;
                } else if (teacher.status === 'MAXIMIZED') {
                    statusBadge = `<span class="status-active">MAXIMIZED</span>`;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${teacher.teacherCode}</td>
                    <td><span class="admin-teacher-name">${teacher.fullName}</span></td>
                    <td>${teacher.department || 'General'}</td>
                    <td><span class="admin-load-value">${teacher.totalLoadHrs} hrs</span></td>
                    <td>${statusBadge}</td>
                    <td><button class="action-btn action-btn--simulate" onclick="viewTeacherDetail('${teacher.id}')">Review eSF7</button></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    const directoryGrid = document.querySelector('.directory-grid');
    if (directoryGrid) {
        directoryGrid.innerHTML = '';

        if (teachers.length === 0) {
            directoryGrid.innerHTML = `<div class="info-box" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No registered teachers found in database.</div>`;
            return;
        }

        teachers.forEach(teacher => {
            const department = teacher.department || 'Unassigned Level';
            const card = document.createElement('div');
            card.className = 'info-box teacher-card-item';
            card.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; height: 100%;';
            
            card.innerHTML = `
                <div class="esf-header" style="margin-bottom: 1rem;">
                    <div>
                        <div class="esf-name" style="font-weight: 600; font-size: 1.1rem;">${teacher.fullName}</div>
                        <div class="esf-role" style="color: #64748b; font-size: 0.9rem;">${department}</div>
                        <div style="margin-top: 0.5rem; font-size: 0.85rem;">
                            <strong>Total Workload:</strong> ${teacher.totalLoadHrs} hrs
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline" style="width: 100%; margin-top: 1rem;" onclick="window.location.href='classprogram.html?teacherId=${teacher.id}'">📄 View Class Program</button>
            `;
            directoryGrid.appendChild(card);
        });
    }
}

function setupDirectorySearch() {
    const searchInput = document.querySelector('.search-bar');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.teacher-card-item');

        cards.forEach(card => {
            const name = card.querySelector('.esf-name')?.innerText.toLowerCase() || '';
            const role = card.querySelector('.esf-role')?.innerText.toLowerCase() || '';

            if (name.includes(searchTerm) || role.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function viewTeacherDetail(teacherId) {
    alert("Opening eSF7 Workload Breakdown for Teacher ID: " + teacherId);
}

if (typeof window.showTeacherList !== 'function') {
    window.showTeacherList = function (status) {
        console.log(`[Teacher List Handler] Filter applied: ${status}`);
    };
}

// State tracker for simulated hours
let totalDeduction = 0;
const baseHours = 48;

function toggleRowSimulation(rowId, hours) {
    const row = document.getElementById(rowId);
    const btn = row.querySelector('.action-btn--simulate');
    
    if (row.classList.contains('simulated-active')) {
        // Revert row
        row.classList.remove('simulated-active');
        row.style.background = 'transparent';
        btn.textContent = 'Simulate';
        btn.style.background = '#e2e8f0';
        btn.style.color = '#334155';
        totalDeduction -= hours;
    } else {
        // Activate simulation mode on row
        row.classList.add('simulated-active');
        row.style.background = '#f0fdf4';
        btn.textContent = 'Simulated ✓';
        btn.style.background = '#16a34a';
        btn.style.color = '#ffffff';
        totalDeduction += hours;
    }

    updateSimulatorDisplay();
}

function applyAllSimulations() {
    ['row-sim-1', 'row-sim-2', 'row-sim-3'].forEach(id => {
        const row = document.getElementById(id);
        if (!row.classList.contains('simulated-active')) {
            row.click();
        }
    });
}

function updateSimulatorDisplay() {
    const newHours = Math.max(35, baseHours - totalDeduction);
    const currentHoursElem = document.getElementById('jdc-current-hours');
    
    if (totalDeduction > 0) {
        currentHoursElem.innerHTML = `<s style="color:#dc2626;">48 hrs</s> → <strong style="color:#16a34a;">${newHours} hrs/wk</strong>`;
    } else {
        currentHoursElem.textContent = '48 hrs/wk';
    }

    // Dynamic Dept Bar Adjustment
    const apBar = document.getElementById('ap-dept-bar');
    const apScore = document.getElementById('ap-dept-score');
    
    if (totalDeduction >= 13) { // When major offloading is simulated
        apBar.style.width = '55%';
        apBar.style.background = '#16a34a';
        apScore.textContent = 'Avg: 37 hrs (Optimal)';
        apScore.style.color = '#16a34a';
    } else {
        apBar.style.width = '85%';
        apBar.style.background = '#dc2626';
        apScore.textContent = 'Avg: 48 hrs (Overloaded)';
        apScore.style.color = '#dc2626';
    }
}

function exportSimulationReport() {
    alert("Reallocation Summary Report generated successfully!\n\nProposed Reassignments:\n• Grade 9 Advisory -> M. Santos (-8 hrs)\n• SDRRM Coordinator -> R. Garcia (-5 hrs)\n• Grade 7 Homeroom -> L. Bautista (-6 hrs)\n\nNew Target Workload: 35 hrs/wk (Optimal)");
}

document.addEventListener('DOMContentLoaded', () => {
    const workloadBtn = document.getElementById('openWorkloadReportBtn');

    if (workloadBtn) {
        workloadBtn.addEventListener('click', () => {
            // Redirects to the master list of all faculty workload reports
            window.location.href = 'workload_reports_directory.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const burnoutBtn = document.getElementById('openBurnoutReportBtn');

    if (burnoutBtn) {
        burnoutBtn.addEventListener('click', () => {
            window.location.href = 'burnout_reports_directory.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherCode = urlParams.get('code');
    if (teacherCode) {
        document.getElementById('diagnosticTeacherCode').textContent = teacherCode;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mock Data Dictionary for Anonymized Teachers
    const burnoutDatabase = {
        'TCH-012': {
            eeScore: 31, eeTier: 'High',
            dpScore: 15, dpTier: 'High',
            paScore: 26, paTier: 'Low (Reduced Efficacy)',
            overallRisk: 'HIGH BURNOUT RISK',
            workload: '48.0 hrs/week (Overloaded)',
            department: 'Araling Panlipunan',
            riskClass: 'text-danger'
        },
        'TCH-018': {
            eeScore: 28, eeTier: 'High',
            dpScore: 14, dpTier: 'High',
            paScore: 28, paTier: 'Low (Reduced Efficacy)',
            overallRisk: 'HIGH BURNOUT RISK',
            workload: '46.5 hrs/week (Overloaded)',
            department: 'English',
            riskClass: 'text-danger'
        },
        'TCH-003': {
            eeScore: 22, eeTier: 'Moderate',
            dpScore: 9,  dpTier: 'Moderate',
            paScore: 33, paTier: 'Moderate Efficacy',
            overallRisk: 'MODERATE BURNOUT RISK',
            workload: '40.0 hrs/week (High Load)',
            department: 'Science',
            riskClass: 'text-warning'
        },
        'TCH-008': {
            eeScore: 12, eeTier: 'Low',
            dpScore: 4,  dpTier: 'Low',
            paScore: 41, paTier: 'High Efficacy',
            overallRisk: 'LOW BURNOUT RISK',
            workload: '36.0 hrs/week (Optimal)',
            department: 'Mathematics',
            riskClass: 'text-success'
        },
        'TCH-004': {
            eeScore: 10, eeTier: 'Low',
            dpScore: 3,  dpTier: 'Low',
            paScore: 44, paTier: 'High Efficacy',
            overallRisk: 'LOW BURNOUT RISK',
            workload: '28.0 hrs/week (Underload)',
            department: 'MAPEH',
            riskClass: 'text-success'
        }
    };

    // 2. Extract Teacher Code from Query String (e.g. ?code=TCH-012)
    const urlParams = new URLSearchParams(window.location.search);
    const teacherCode = urlParams.get('code') || 'TCH-012'; // Fallback to TCH-012

    // 3. Populate Page Fields Dynamic to Tapped Entry
    const teacherData = burnoutDatabase[teacherCode] || burnoutDatabase['TCH-012'];

    // Header & Code
    const codeElem = document.getElementById('diagnosticTeacherCode');
    if (codeElem) codeElem.textContent = teacherCode;

    // Overall Tier Display
    const tierElem = document.querySelector('.overall-tier-box .tier-val');
    if (tierElem) {
        tierElem.textContent = teacherData.overallRisk;
        tierElem.className = `tier-val ${teacherData.riskClass}`;
    }

    // Workload & Dept Details
    const infoRows = document.querySelectorAll('.profile-info-table tr');
    if (infoRows.length >= 4) {
        infoRows[2].querySelectorAll('td')[1].textContent = teacherData.department;
        
        const workloadTd = infoRows[3].querySelectorAll('td')[1];
        workloadTd.textContent = teacherData.workload;
        workloadTd.className = `info-val ${teacherData.riskClass}`;
    }

    // Subscale Scores
    const eeScoreElem = document.querySelector('.subscales-grid .subscale-card:nth-child(1) .subscale-score');
    if (eeScoreElem) eeScoreElem.innerHTML = `${teacherData.eeScore} <span class="subscale-max">/ 54</span>`;

    const dpScoreElem = document.querySelector('.subscales-grid .subscale-card:nth-child(2) .subscale-score');
    if (dpScoreElem) dpScoreElem.innerHTML = `${teacherData.dpScore} <span class="subscale-max">/ 30</span>`;

    const paScoreElem = document.querySelector('.subscales-grid .subscale-card:nth-child(3) .subscale-score');
    if (paScoreElem) paScoreElem.innerHTML = `${teacherData.paScore} <span class="subscale-max">/ 48</span>`;
});