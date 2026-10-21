/**
 * Master Calendar Management Engine - DepEd Elementary School
 * Kandili Workspace - ROVCMS
 */

let currentDate = new Date(2026, 8, 16); // September 16, 2026
let selectedDate = new Date(2026, 8, 16);

// Elementary Seed Data with Targeted Faculty and Grade Clusters
let eventsData = [
    {
        id: 'evt-1',
        title: 'DepEd InSET Workshop: MATATAG Curriculum',
        type: 'schoolwide',
        audience: 'All Faculty',
        date: '2026-09-18',
        startTime: '08:00',
        endTime: '16:00',
        daysSpan: 1
    },
    {
        id: 'evt-2',
        title: 'Classroom Walkthrough & Post-Conference',
        type: 'appointment',
        audience: 'Sarah J. Cruz (TCH-012)',
        date: '2026-09-21',
        startTime: '09:00',
        endTime: '10:30',
        daysSpan: 1
    },
    {
        id: 'evt-3',
        title: 'Primary (Grades 1-3) Early Literacy LAC',
        type: 'department',
        audience: 'Grades 1-3 (Primary)',
        date: '2026-09-24',
        startTime: '13:00',
        endTime: '15:00',
        daysSpan: 1
    },
    {
        id: 'evt-4',
        title: 'Ancillary SDRRM & Feeding Audit',
        type: 'deadline',
        audience: 'SDRRM & Feeding Coordinators',
        date: '2026-09-28',
        startTime: '14:00',
        endTime: '16:00',
        daysSpan: 1
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initRoleGuards();
    initCalendar();
    initTopNavActions();
    initFormHandlers();
    initLogoutHandler();
});

/* ==========================================================================
   1. Role Guarding & Target Adaptation (Teacher vs Principal)
   ========================================================================== */
function getUserOrigin() {
    const urlParams = new URLSearchParams(window.location.search);
    const originParam = urlParams.get('origin');
    if (originParam) return originParam.toLowerCase();

    if (document.referrer.toLowerCase().includes('/teacher/')) return 'teacher';
    if (document.referrer.toLowerCase().includes('/principal/')) return 'principal';

    const storedRole = (
        sessionStorage.getItem('kandili_user_role') ||
        localStorage.getItem('kandili_user_role') ||
        sessionStorage.getItem('user_role') ||
        localStorage.getItem('user_role') ||
        'principal'
    ).toLowerCase();

    return storedRole.includes('teacher') ? 'teacher' : 'principal';
}

function initRoleGuards() {
    const role = getUserOrigin();
    const typeSelect = document.getElementById('eventType');
    const audienceSelect = document.getElementById('targetAudience');
    const roleTag = document.getElementById('calendarRoleBadge');
    const dashLink = document.getElementById('navDashboardLink');

    if (dashLink) {
        dashLink.href = (role === 'teacher') 
            ? '../teacher/teacherdashboard.html' 
            : '../principal/principaldashboard.html';
    }

    if (role === 'teacher') {
        if (roleTag) roleTag.textContent = 'Faculty Personal Schedule';

        // Restrict choices for teachers
        if (typeSelect) {
            typeSelect.innerHTML = `
                <option value="appointment" selected>Classroom Activity / Consultation</option>
                <option value="department">Grade 2 Team Meeting</option>
            `;
        }
        if (audienceSelect) {
            audienceSelect.innerHTML = `
                <option value="Sarah J. Cruz (TCH-012)" selected>Sarah J. Cruz (My Section: G2-A)</option>
                <option value="Personal">Personal Prep Period</option>
            `;
        }
    } else {
        if (roleTag) roleTag.textContent = 'Principal Institutional Authority';
    }
}

/* ==========================================================================
   2. Calendar Engine
   ========================================================================== */
function initCalendar() {
    renderCalendar();
    updateSidebarSelectedDay();
    updateSidebarStats();

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
        currentDate = new Date(2026, 8, 16);
        selectedDate = new Date(2026, 8, 16);
        renderCalendar();
        updateSidebarSelectedDay();
        updateSidebarStats();
    });

    document.getElementById('addEventBtn')?.addEventListener('click', () => {
        openEventFormForAdd();
    });

    document.getElementById('cancelEventBtn')?.addEventListener('click', () => {
        document.getElementById('eventForm')?.classList.add('hidden');
    });
}

function openEventFormForAdd() {
    const form = document.getElementById('eventForm');
    if (!form) return;

    form.reset();
    document.getElementById('eventId').value = '';
    document.getElementById('formHeader').textContent = 'Create Schedule Entry';
    document.getElementById('deleteEventBtn')?.classList.add('hidden');
    
    // Pre-fill target date
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('eventTargetDate');
    if (dateInput) dateInput.value = `${y}-${m}-${d}`;

    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initTopNavActions() {
    document.getElementById('navBackBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const role = getUserOrigin();
        window.location.href = (role === 'teacher') 
            ? '../teacher/teacherdashboard.html' 
            : '../principal/principaldashboard.html';
    });

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

    // Previous month padding
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
            <div class="event-chip chip-${e.type || 'schoolwide'}" title="${e.title} &bull; ${e.audience}">
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

    // Next month padding
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
            <span style="display:block; margin: 0.15rem 0;"><i class="far fa-clock"></i> ${e.startTime} - ${e.endTime}</span>
            <span class="badge-target-attendee"><i class="fas fa-user-tag"></i> ${e.audience}</span>
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
    document.getElementById('deptCount').textContent = monthEvents.filter(e => e.type === 'appointment' || e.type === 'department').length;
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

    const dateInput = document.getElementById('eventTargetDate');
    if (dateInput) dateInput.value = event.date;

    document.getElementById('formHeader').textContent = 'Edit Schedule Entry';
    document.getElementById('deleteEventBtn')?.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

/* ==========================================================================
   3. Form Submission
   ========================================================================== */
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
        const customDate = document.getElementById('eventTargetDate')?.value;

        const dateStr = customDate || `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        if (!title) {
            alert('Please enter an event or appointment title.');
            return;
        }

        if (id) {
            // Edit existing
            const target = eventsData.find(e => e.id === id);
            if (target) {
                target.title = title;
                target.type = type;
                target.audience = audience;
                target.date = dateStr;
                target.startTime = startTime;
                target.endTime = endTime;
                target.daysSpan = daysSpan;
            }
        } else {
            // Add new
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