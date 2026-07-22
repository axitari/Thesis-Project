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