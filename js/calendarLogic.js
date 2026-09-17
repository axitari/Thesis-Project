/**
 * Master Calendar Management Engine
 * Kandili Workspace - DepEd Master Calendar
 */

let currentDate = new Date(2026, 8, 16); // September 16, 2026[cite: 7]
let selectedDate = new Date(2026, 8, 16);

let eventsData = [
    {
        id: 'evt-1',
        title: 'Midyear InSET Workshop (Day 1)',
        type: 'schoolwide',
        audience: 'All Faculty',
        date: '2026-09-18',
        startTime: '08:00',
        endTime: '16:00',
        daysSpan: 1
    },
    {
        id: 'evt-2',
        title: 'eSF7 Load Audit Submission Deadline',
        type: 'deadline',
        audience: 'Department Heads',
        date: '2026-09-21',
        startTime: '17:00',
        endTime: '18:00',
        daysSpan: 1
    },
    {
        id: 'evt-3',
        title: 'Science Dept LAC Session',
        type: 'department',
        audience: 'Junior High School',
        date: '2026-09-24',
        startTime: '13:00',
        endTime: '15:00',
        daysSpan: 1
    },
    {
        id: 'evt-4',
        title: 'Division Evaluator Visit',
        type: 'evaluation',
        audience: 'All Faculty',
        date: '2026-09-28',
        startTime: '09:00',
        endTime: '12:00',
        daysSpan: 1
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    initTopNavActions();
    initFormHandlers();
    initLogoutHandler();
});

function initCalendar() {
    // Dynamic dashboard link in sidebar based on stored user role
    const userRole = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
    const dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
        dashLink.href = userRole === 'teacher' ? '../teacher/teacherdashboard.html' : '../principal/principaldashboard.html';
    }

    renderCalendar();
    updateSidebarSelectedDay();
    updateSidebarStats();

    // Month Navigation triggers
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        updateSidebarStats();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        updateSidebarStats();
    });

    document.getElementById('todayBtn')?.addEventListener('click', () => {
        currentDate = new Date(2026, 8, 16); // Sept 16, 2026
        selectedDate = new Date(2026, 8, 16);
        renderCalendar();
        updateSidebarSelectedDay();
        updateSidebarStats();
    });

    // Toggle event form expansion
    document.getElementById('addEventBtn')?.addEventListener('click', () => {
        const form = document.getElementById('eventForm');
        form.reset();
        document.getElementById('eventId').value = '';
        document.getElementById('formHeader').textContent = 'Create New Event';
        document.getElementById('deleteEventBtn')?.classList.add('hidden');
        form?.classList.toggle('hidden');
    });

    document.getElementById('cancelEventBtn')?.addEventListener('click', () => {
        document.getElementById('eventForm')?.classList.add('hidden');
    });
}

function initTopNavActions() {
    const backBtn = document.getElementById('navBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const role = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
            window.location.href = (role === 'teacher') 
                ? '../teacher/teacherdashboard.html' 
                : '../principal/principaldashboard.html';
        });
    }

    document.getElementById('navRefreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthLabel');
    if (!grid || !monthLabel) return;

    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // Previous month padding days
    for (let i = firstDayIndex; i > 0; i--) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day other-month';
        dayCell.innerHTML = `<span class="day-number">${prevLastDay - i + 1}</span>`;
        grid.appendChild(dayCell);
    }

    // Current month days
    for (let day = 1; day <= lastDay; day++) {
        const dayCell = document.createElement('div');
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dayCell.className = 'calendar-day';
        if (year === 2026 && month === 8 && day === 16) {
            dayCell.classList.add('today');
        }
        if (
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === day
        ) {
            dayCell.classList.add('selected');
        }

        const eventsToday = eventsData.filter(e => e.date === dateStr);
        const chipsHtml = eventsToday.map(e => `
            <div class="event-chip chip-${e.type}" title="${e.title} (${e.startTime})">
                ${e.title}
            </div>
        `).join('');

        dayCell.innerHTML = `
            <span class="day-number">${day}</span>
            <div class="calendar-day-events">${chipsHtml}</div>
        `;

        dayCell.addEventListener('click', () => {
            selectedDate = new Date(year, month, day);
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayCell.classList.add('selected');
            updateSidebarSelectedDay();
        });

        grid.appendChild(dayCell);
    }

    // Next month padding days to complete 7-day grid rows
    const totalCells = firstDayIndex + lastDay;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day other-month';
            dayCell.innerHTML = `<span class="day-number">${i}</span>`;
            grid.appendChild(dayCell);
        }
    }
}

function updateSidebarSelectedDay() {
    const label = document.getElementById('selectedDateLabel');
    const container = document.getElementById('selectedEvents');
    if (!label || !container) return;

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    label.textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const eventsToday = eventsData.filter(e => e.date === dateStr);
    if (eventsToday.length === 0) {
        container.innerHTML = '<p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">No activities scheduled for this date.</p>';
        return;
    }

    container.innerHTML = eventsToday.map(e => `
        <div class="event-sidebar-item" onclick="openEventForEdit('${e.id}')">
            <strong>${e.title}</strong>
            <span><i class="far fa-clock"></i> ${e.startTime} - ${e.endTime} | ${e.audience}</span>
        </div>
    `).join('');
}

function updateSidebarStats() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthEvents = eventsData.filter(e => e.date.startsWith(monthPrefix));
    
    document.getElementById('monthEventCount').textContent = monthEvents.length;
    document.getElementById('schoolCount').textContent = monthEvents.filter(e => e.type === 'schoolwide').length;
    document.getElementById('deptCount').textContent = monthEvents.filter(e => e.type === 'department').length;
}

window.openEventForEdit = function(id) {
    const event = eventsData.find(e => e.id === id);
    if (!event) return;

    const form = document.getElementById('eventForm');
    form.classList.remove('hidden');

    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventType').value = event.type;
    document.getElementById('targetAudience').value = event.audience;
    document.getElementById('eventStartTime').value = event.startTime;
    document.getElementById('eventEndTime').value = event.endTime;
    document.getElementById('eventDaysSpan').value = event.daysSpan || 1;

    document.getElementById('formHeader').textContent = 'Edit Event Details';
    document.getElementById('deleteEventBtn')?.classList.remove('hidden');
};

function initFormHandlers() {
    const form = document.getElementById('eventForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('eventId').value;
        const title = document.getElementById('eventTitle').value.trim();
        const type = document.getElementById('eventType').value;
        const audience = document.getElementById('targetAudience').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        const daysSpan = parseInt(document.getElementById('eventDaysSpan').value, 10) || 1;

        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        if (id) {
            // Edit existing
            const target = eventsData.find(e => e.id === id);
            if (target) {
                target.title = title;
                target.type = type;
                target.audience = audience;
                target.startTime = startTime;
                target.endTime = endTime;
                target.daysSpan = daysSpan;
            }
        } else {
            // Create new
            eventsData.push({
                id: `evt-${Date.now()}`,
                title,
                type,
                audience,
                date: dateStr,
                startTime,
                endTime,
                daysSpan
            });
        }

        form.classList.add('hidden');
        renderCalendar();
        updateSidebarSelectedDay();
        updateSidebarStats();
    });

    document.getElementById('deleteEventBtn')?.addEventListener('click', () => {
        const id = document.getElementById('eventId').value;
        if (!id) return;

        if (confirm('Are you sure you want to remove this calendar entry?')) {
            eventsData = eventsData.filter(e => e.id !== id);
            document.getElementById('eventForm').classList.add('hidden');
            renderCalendar();
            updateSidebarSelectedDay();
            updateSidebarStats();
        }
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

function handleRoleAwareBack(e) {
    if (e) e.preventDefault();

    // 1. Check if the user navigated from a teacher page via browser referrer
    if (document.referrer && document.referrer.includes('/teacher/')) {
        window.location.href = '../teacher/teacherdashboard.html';
        return;
    }

    // 2. Check if the user navigated from a principal page
    if (document.referrer && document.referrer.includes('/principal/')) {
        window.location.href = '../principal/principaldashboard.html';
        return;
    }

    // 3. Check session/local storage with all common role keys
    const detectedRole = (
        sessionStorage.getItem('kandili_role') ||
        localStorage.getItem('kandili_role') ||
        sessionStorage.getItem('role') ||
        localStorage.getItem('role') ||
        ''
    ).toLowerCase();

    if (detectedRole === 'teacher') {
        window.location.href = '../teacher/teacherdashboard.html';
    } else {
        window.location.href = '../principal/principaldashboard.html';
    }
}