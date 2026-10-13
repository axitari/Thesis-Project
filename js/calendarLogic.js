/**
 * Master Calendar Controller v3.0
 * Architecture: Inline Non-Blur Panel + Role Enforcement
 */

let activeUserRole = 'teacher';
let currentViewDate = new Date();
let activeSelectedDate = new Date().toISOString().split('T')[0];

// Shared institutional seed events + individual teacher tasks
let calendarDataStore = [
    {
        id: 'evt-1',
        title: 'Midyear InSET Training Session',
        date: '2026-10-15',
        category: 'schoolwide',
        scope: 'institutional',
        audience: 'All Faculty',
        startTime: '08:00',
        duration: '240',
        createdByRole: 'principal'
    },
    {
        id: 'evt-2',
        title: 'Form 137 Student Records Audit',
        date: '2026-10-20',
        category: 'deadline',
        scope: 'institutional',
        audience: 'Grades 1-3 Teachers',
        startTime: '13:00',
        duration: '120',
        createdByRole: 'principal'
    },
    {
        id: 'evt-3',
        title: 'Grade 2 Lesson Preparation & DLL Review',
        date: '2026-10-14',
        category: 'personal',
        scope: 'personal',
        audience: 'Self Only',
        startTime: '16:00',
        duration: '60',
        createdByRole: 'teacher'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initRoleRouting();
    initLogoutHandler();
    initCalendarWorkspace();
});

/* ==========================================================================
   1. Role Authentication & Navigation
   ========================================================================== */
function initRoleRouting() {
    const params = new URLSearchParams(window.location.search);
    let origin = params.get('origin');

    if (!origin) {
        origin = sessionStorage.getItem('kandili_user_role');
    }
    if (!origin) {
        const ref = (document.referrer || '').toLowerCase();
        origin = ref.includes('principal') ? 'principal' : 'teacher';
    }

    activeUserRole = origin;
    sessionStorage.setItem('kandili_user_role', activeUserRole);

    // Update role badge in Hero bar
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.innerHTML = activeUserRole === 'principal'
            ? `<i class="fas fa-user-shield"></i> School Head (Institutional Authority)`
            : `<i class="fas fa-chalkboard-user"></i> Faculty Member (Personal Workspace)`;
    }

    // Configure role-dependent form fields
    const categorySelect = document.getElementById('entryCategory');
    const targetContainer = document.getElementById('targetAudienceContainer');
    const titleLabel = document.getElementById('titleInputLabel');
    const scopeBadge = document.getElementById('scopeBadge');
    const toggleBtnLabel = document.getElementById('toggleBtnLabel');

    if (categorySelect) {
        if (activeUserRole === 'principal') {
            categorySelect.innerHTML = `
                <option value="schoolwide">Schoolwide Activity</option>
                <option value="department">Department / LAC Session</option>
                <option value="deadline">DepEd Statutory Deadline</option>
            `;
            if (targetContainer) targetContainer.style.display = 'flex';
            if (titleLabel) titleLabel.textContent = 'Event / Mandated Activity Title';
            if (scopeBadge) scopeBadge.textContent = 'Principal Authority';
            if (toggleBtnLabel) toggleBtnLabel.textContent = 'Add School Event';
        } else {
            // Teacher is strictly personal
            categorySelect.innerHTML = `
                <option value="personal">Personal Lesson Prep</option>
                <option value="grading">Grading & Assessment Checks</option>
                <option value="records">Form 137 / eSF Data Encoding</option>
            `;
            if (targetContainer) targetContainer.style.display = 'none'; // Teachers cannot broadcast
            if (titleLabel) titleLabel.textContent = 'Personal Task Title';
            if (scopeBadge) scopeBadge.textContent = 'Personal Faculty Log';
            if (toggleBtnLabel) toggleBtnLabel.textContent = 'Add Personal Task';
        }
    }

    // Retain ?origin= across general navigation links
    const dashboardLink = document.getElementById('navDashboardLink');
    if (dashboardLink) {
        dashboardLink.setAttribute(
            'href',
            activeUserRole === 'principal'
                ? '../principal/principaldashboard.html'
                : '../teacher/teacherdashboard.html'
        );
    }

    const linksToPreserve = [
        { id: 'navCalendarLink', file: 'calendar.html' },
        { id: 'navNotificationsLink', file: 'notification.html' },
        { id: 'navMessagesLink', file: 'message.html' },
        { id: 'navHistoryLink', file: 'history.html' },
        { id: 'navSettingsLink', file: 'settings.html' }
    ];

    linksToPreserve.forEach(item => {
        const elem = document.getElementById(item.id);
        if (elem) elem.setAttribute('href', `${item.file}?origin=${activeUserRole}`);
    });

    // Back button
    document.getElementById('navBackBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const targetDashboard = activeUserRole === 'principal'
            ? '../principal/principaldashboard.html'
            : '../teacher/teacherdashboard.html';

        const referrer = document.referrer || '';
        const isInternal = (referrer.includes('/html/') || referrer.includes('dashboard')) && !referrer.includes('login.html');

        window.location.href = isInternal ? referrer : targetDashboard;
    });

    // Refresh button
    document.getElementById('navRefreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });
}

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
   2. Calendar Engine & Inline Drawer Form
   ========================================================================== */
function initCalendarWorkspace() {
    // Month navigation
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        renderCalendarGrid();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        renderCalendarGrid();
    });

    document.getElementById('todayBtn')?.addEventListener('click', () => {
        currentViewDate = new Date();
        activeSelectedDate = new Date().toISOString().split('T')[0];
        renderCalendarGrid();
    });

    // Toggle creation panel
    const toggleBtn = document.getElementById('toggleFormBtn');
    const panel = document.getElementById('inlineEventPanel');
    const cancelBtn = document.getElementById('cancelEntryBtn');

    toggleBtn?.addEventListener('click', () => {
        if (panel.classList.contains('hidden')) {
            openInlineForm();
        } else {
            closeInlineForm();
        }
    });

    cancelBtn?.addEventListener('click', closeInlineForm);

    // Save entry
    document.getElementById('scheduleForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveScheduleEntry();
    });

    // Delete entry
    document.getElementById('deleteEntryBtn')?.addEventListener('click', () => {
        const recordId = document.getElementById('entryRecordId')?.value;
        const target = calendarDataStore.find(e => e.id === recordId);

        if (activeUserRole === 'teacher' && target && target.createdByRole === 'principal') {
            alert("Permission Denied: Teachers cannot delete schoolwide events set by the Principal.");
            return;
        }

        if (recordId && confirm("Delete this schedule entry?")) {
            calendarDataStore = calendarDataStore.filter(e => e.id !== recordId);
            closeInlineForm();
            renderCalendarGrid();
        }
    });

    renderCalendarGrid();
}

function openInlineForm(record = null) {
    const panel = document.getElementById('inlineEventPanel');
    const title = document.getElementById('panelTitle');
    const deleteBtn = document.getElementById('deleteEntryBtn');

    if (!panel) return;
    panel.classList.remove('hidden');

    if (record) {
        title.textContent = activeUserRole === 'principal' ? 'Edit Institutional Event' : 'Edit Personal Task';
        deleteBtn?.classList.remove('hidden');
        document.getElementById('entryRecordId').value = record.id;
        document.getElementById('entryTitle').value = record.title;
        document.getElementById('entryCategory').value = record.category;
        document.getElementById('entryStartTime').value = record.startTime;
        document.getElementById('entryDuration').value = record.duration;

        if (activeUserRole === 'principal') {
            document.getElementById('entryTarget').value = record.audience || 'All Faculty';
        }
    } else {
        title.textContent = activeUserRole === 'principal' ? 'Create Institutional Event' : 'Log Personal Task';
        deleteBtn?.classList.add('hidden');
        document.getElementById('entryRecordId').value = '';
        document.getElementById('scheduleForm').reset();
        document.getElementById('entryStartTime').value = '08:00';
        document.getElementById('entryDuration').value = '60';
    }
}

function closeInlineForm() {
    document.getElementById('inlineEventPanel')?.classList.add('hidden');
}

function saveScheduleEntry() {
    const recordId = document.getElementById('entryRecordId')?.value;
    const title = document.getElementById('entryTitle')?.value.trim();
    const category = document.getElementById('entryCategory')?.value;
    const startTime = document.getElementById('entryStartTime')?.value;
    const duration = document.getElementById('entryDuration')?.value;

    if (!title) {
        alert("Please provide a title.");
        return;
    }

    const audience = activeUserRole === 'principal'
        ? (document.getElementById('entryTarget')?.value || 'All Faculty')
        : 'Self Only';

    const scope = activeUserRole === 'principal' ? 'institutional' : 'personal';

    if (recordId) {
        const found = calendarDataStore.find(e => e.id === recordId);
        if (found) {
            found.title = title;
            found.category = category;
            found.audience = audience;
            found.startTime = startTime;
            found.duration = duration;
        }
    } else {
        calendarDataStore.push({
            id: `evt-${Date.now()}`,
            title,
            date: activeSelectedDate,
            category,
            scope,
            audience,
            startTime,
            duration,
            createdByRole: activeUserRole
        });
    }

    closeInlineForm();
    renderCalendarGrid();
}

/* ==========================================================================
   3. Grid Rendering & Selected Date Inspector
   ========================================================================== */
function renderCalendarGrid() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    document.getElementById('monthLabel').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendarMonthGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell other-month';
        cell.innerHTML = `<span class="cell-number">${prevTotalDays - i}</span>`;
        grid.appendChild(cell);
    }

    // Current month cells
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';

        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const cellDate = `${year}-${monthStr}-${dayStr}`;

        if (cellDate === todayStr) cell.classList.add('is-today');
        if (cellDate === activeSelectedDate) cell.classList.add('is-selected');

        cell.innerHTML = `<span class="cell-number">${day}</span>`;

        // Render matching badges
        const dayEvents = calendarDataStore.filter(e => {
            if (e.date !== cellDate) return false;
            if (activeUserRole === 'principal') return true;
            return e.scope === 'institutional' || e.createdByRole === 'teacher';
        });

        dayEvents.forEach(evt => {
            const badge = document.createElement('div');
            badge.className = `cell-badge badge-${evt.category}`;
            badge.textContent = evt.title;
            badge.title = `${evt.title} (${evt.audience})`;
            cell.appendChild(badge);
        });

        cell.addEventListener('click', () => {
            document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('is-selected'));
            cell.classList.add('is-selected');
            activeSelectedDate = cellDate;
            renderInspectorDetails();
        });

        grid.appendChild(cell);
    }

    updateOverviewStats(month, year);
    renderInspectorDetails();
}

function renderInspectorDetails() {
    const dateLabel = document.getElementById('inspectorDateText');
    const list = document.getElementById('inspectorEventsList');
    if (!dateLabel || !list) return;

    dateLabel.textContent = activeSelectedDate;
    const dayEvents = calendarDataStore.filter(e => {
        if (e.date !== activeSelectedDate) return false;
        if (activeUserRole === 'principal') return true;
        return e.scope === 'institutional' || e.createdByRole === 'teacher';
    });

    if (dayEvents.length === 0) {
        list.innerHTML = `<div class="inspector-empty">No tasks or events scheduled for this date.</div>`;
        return;
    }

    list.innerHTML = dayEvents.map(e => `
        <div class="inspector-item" data-id="${e.id}">
            <strong>${e.title}</strong>
            <div class="inspector-meta">
                <i class="fas fa-tag"></i> ${e.scope === 'institutional' ? 'DepEd School Activity' : 'Personal Teacher Task'}
            </div>
            ${e.scope === 'institutional' ? `
            <div class="inspector-meta">
                <i class="fas fa-user-tag"></i> Target: ${e.audience}
            </div>` : ''}
            <div class="inspector-meta">
                <i class="fas fa-clock"></i> ${e.startTime} (${formatMins(e.duration)})
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.inspector-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const found = calendarDataStore.find(e => e.id === id);
            if (found) {
                if (activeUserRole === 'teacher' && found.createdByRole === 'principal') {
                    alert(`[Notice] Official Institutional Event\nTitle: ${found.title}\nTarget: ${found.audience}\nTime: ${found.startTime}`);
                } else {
                    openInlineForm(found);
                }
            }
        });
    });
}

function formatMins(minutes) {
    const val = parseInt(minutes, 10);
    if (val >= 60) return `${val / 60} hr${val > 60 ? 's' : ''}`;
    return `${val} mins`;
}

function updateOverviewStats(month, year) {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyItems = calendarDataStore.filter(e => e.date.startsWith(monthPrefix));

    document.getElementById('statTotalMonth').textContent = monthlyItems.length;
    document.getElementById('statSchoolwide').textContent = monthlyItems.filter(e => e.scope === 'institutional').length;
    document.getElementById('statPersonalTasks').textContent = monthlyItems.filter(e => e.scope === 'personal').length;
}