// static/calendarLogic.js

(function() {
    let eventsList = [];
    let currentDate = new Date();
    let selectedDate = new Date();
    let userRole = 'teacher';
    let userId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        await initCalendar();
        setupEventListeners();
    });

    async function initCalendar() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) return;

            userId = session.user.id;

            // Fetch user profile role from Supabase
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profile && profile.role) {
                userRole = profile.role.toLowerCase();
            }

            // Populate Category Select Dropdown based on verified role
            updateCategoryDropdown();

            await fetchCalendarEvents();
            renderCalendar();

        } catch (err) {
            console.error("Failed to initialize calendar:", err);
        }
    }

    function updateCategoryDropdown() {
        const eventTypeSelect = document.getElementById('eventType');
        if (!eventTypeSelect) return;

        if (userRole === 'principal' || userRole === 'admin') {
            eventTypeSelect.innerHTML = `
                <option value="schoolwide">Schoolwide Event (Visible to entire school)</option>
                <option value="personal">Personal Note (Visible only to you)</option>
            `;
        } else {
            eventTypeSelect.innerHTML = `
                <option value="personal">Personal Event (Visible only to you)</option>
            `;
        }
    }

    // Fetch Events from Supabase (RLS applies filtering)
    async function fetchCalendarEvents() {
        try {
            const { data: events, error } = await window.supabaseClient
                .from('events')
                .select('*')
                .order('start_time', { ascending: true });

            if (error) throw error;

            eventsList = (events || []).map(e => ({
                id: e.id,
                date: e.start_time.split('T')[0],
                title: e.title,
                type: e.event_type, // 'schoolwide' or 'personal'
                time: e.description || 'All Day',
                createdBy: e.created_by,
                canDelete: e.created_by === userId || (e.event_type === 'schoolwide' && (userRole === 'principal' || userRole === 'admin'))
            }));

        } catch (err) {
            console.error("Error fetching calendar events:", err.message);
        }
    }

    // Render Calendar Grid & Sidebar
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstWeekday = firstDay.getDay();
        const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

        const monthLabel = document.getElementById('monthLabel');
        const calendarGrid = document.getElementById('calendarGrid');

        if (monthLabel) monthLabel.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        const todayKey = formatDateKey(new Date());
        const selectedKey = formatDateKey(selectedDate);
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        const monthEvents = eventsList.filter(e => e.date.startsWith(monthKey));
        
        const countTotal = document.getElementById('monthEventCount');
        const countSchool = document.getElementById('schoolCount');
        const countPersonal = document.getElementById('personalCount');

        if (countTotal) countTotal.textContent = monthEvents.length;
        if (countSchool) countSchool.textContent = monthEvents.filter(e => e.type === 'schoolwide').length;
        if (countPersonal) countPersonal.textContent = monthEvents.filter(e => e.type === 'personal').length;

        for (let i = 0; i < totalCells; i++) {
            const dayNumber = i - firstWeekday + 1;
            const cellDate = new Date(year, month, dayNumber);
            const isCurrentMonth = cellDate.getMonth() === month;
            const cellKey = formatDateKey(cellDate);
            const isToday = cellKey === todayKey;
            const isSelected = cellKey === selectedKey;

            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day${isCurrentMonth ? '' : ' disabled'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`;
            dayEl.innerHTML = `
                <div class="date-row">
                    <span class="date-number">${isCurrentMonth ? cellDate.getDate() : ''}</span>
                    ${isToday ? '<span class="today-pill" style="background:#0038A8; color:#fff; padding:1px 6px; border-radius:10px; font-size:0.7rem;">Today</span>' : ''}
                </div>
            `;

            if (isCurrentMonth) {
                const dayEvents = eventsList.filter(e => e.date === cellKey);
                dayEvents.slice(0, 2).forEach(event => {
                    const pill = document.createElement('div');
                    pill.className = `event-pill event-${event.type}`;
                    pill.style.cssText = `padding: 2px 6px; margin-top: 4px; border-radius: 4px; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; ${event.type === 'schoolwide' ? 'background: #0038A8; color: #ffffff;' : 'background: #10b981; color: #ffffff;'}`;
                    pill.textContent = event.title;
                    pill.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectedDate = cellDate;
                        renderCalendar();
                    });
                    dayEl.appendChild(pill);
                });

                if (dayEvents.length > 2) {
                    const more = document.createElement('div');
                    more.className = 'event-pill event-more';
                    more.style.cssText = 'font-size: 0.7rem; color: #64748b; margin-top: 2px;';
                    more.textContent = `+${dayEvents.length - 2} more`;
                    dayEl.appendChild(more);
                }
            }

            dayEl.addEventListener('click', () => {
                if (!isCurrentMonth) return;
                selectedDate = cellDate;
                renderCalendar();
            });

            calendarGrid.appendChild(dayEl);
        }

        updateSelectedEvents();
    }

    function updateSelectedEvents() {
        const selectedDateLabel = document.getElementById('selectedDateLabel');
        const selectedEvents = document.getElementById('selectedEvents');
        const key = formatDateKey(selectedDate);
        const dayEvents = eventsList.filter(e => e.date === key);

        if (selectedDateLabel) selectedDateLabel.textContent = formatDisplayDate(selectedDate);
        if (!selectedEvents) return;

        if (dayEvents.length === 0) {
            selectedEvents.innerHTML = '<div class="empty-state" style="padding: 1rem 0; color: #94a3b8; font-size: 0.9rem;">No events scheduled for this day.</div>';
            return;
        }

        selectedEvents.innerHTML = dayEvents.map(event => `
            <div class="detail-card" style="padding: 0.85rem; margin-bottom: 0.75rem; background: #ffffff; border-left: 4px solid ${event.type === 'schoolwide' ? '#0038A8' : '#10b981'}; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: #0f172a; font-size: 0.95rem;">${event.title}</strong>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                            ${event.time} &bull; <span style="text-transform: capitalize; font-weight: 600; color: ${event.type === 'schoolwide' ? '#0038A8' : '#059669'};">${event.type}</span>
                        </div>
                    </div>
                    ${event.canDelete ? `<button class="delete-evt-btn" data-id="${event.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem;" title="Delete Event"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>
        `).join('');

        // Attach event listener for delete buttons
        document.querySelectorAll('.delete-evt-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteCalendarEvent(btn.dataset.id));
        });
    }

    function setupEventListeners() {
        const prevBtn = document.getElementById('prevMonthBtn');
        const nextBtn = document.getElementById('nextMonthBtn');
        const todayBtn = document.getElementById('todayBtn');
        const addEventBtn = document.getElementById('addEventBtn');
        const cancelEventBtn = document.getElementById('cancelEventBtn');
        const eventForm = document.getElementById('eventForm');
        const refreshBtn = document.getElementById('refreshBtn');

        if (prevBtn) prevBtn.addEventListener('click', () => { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); renderCalendar(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); renderCalendar(); });
        if (todayBtn) todayBtn.addEventListener('click', () => { currentDate = new Date(); selectedDate = new Date(); renderCalendar(); });
        if (refreshBtn) refreshBtn.addEventListener('click', async () => { await fetchCalendarEvents(); renderCalendar(); });

        if (addEventBtn && eventForm) {
            addEventBtn.addEventListener('click', () => {
                updateCategoryDropdown();
                document.getElementById('eventTitle').value = '';
                document.getElementById('eventTime').value = '';
                eventForm.classList.remove('hidden');
            });
        }

        if (cancelEventBtn && eventForm) {
            cancelEventBtn.addEventListener('click', () => eventForm.classList.add('hidden'));
        }

        if (eventForm) {
            eventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('eventTitle').value.trim();
                const type = document.getElementById('eventType').value;
                const time = document.getElementById('eventTime').value.trim() || 'All Day';

                if (!title) return;

                const saveBtn = document.getElementById('saveEventBtn');
                if (saveBtn) {
                    saveBtn.innerText = 'Saving...';
                    saveBtn.disabled = true;
                }

                try {
                    const { error } = await window.supabaseClient
                        .from('events')
                        .insert({
                            title: title,
                            event_type: type, // 'personal' or 'schoolwide'
                            description: time,
                            start_time: formatDateKey(selectedDate) + 'T00:00:00Z',
                            created_by: userId
                        });

                    if (error) throw error;

                    eventForm.classList.add('hidden');
                    await fetchCalendarEvents();
                    renderCalendar();

                } catch (err) {
                    alert("Failed to save event: " + err.message);
                } finally {
                    if (saveBtn) {
                        saveBtn.innerText = 'Save Event';
                        saveBtn.disabled = false;
                    }
                }
            });
        }
    }

    async function deleteCalendarEvent(eventId) {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            const { error } = await window.supabaseClient
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            await fetchCalendarEvents();
            renderCalendar();

        } catch (err) {
            alert("Failed to delete event: " + err.message);
        }
    }

    function formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function formatDisplayDate(date) {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
})();

/* ============================================================ */
/* KANDILI MASTER CALENDAR - ROLE-BASED ACCESS CONTROL LOGIC      */
/* ============================================================ */

// Retrieve active user role from localStorage (defaults to 'principal' if null)
const currentUserRole = localStorage.getItem('user_role') || 'principal'; 

let events = [
    { id: 101, date: '2026-07-03', title: 'Q1 Faculty Meeting', type: 'school', time: '09:00 AM' },
    { id: 102, date: '2026-07-18', title: 'Grade Submission Deadline', type: 'school', time: '05:00 PM' },
    { id: 103, date: '2026-07-18', title: 'Parent-Teacher Conference', type: 'personal', time: '03:00 PM' },
    { id: 104, date: '2026-07-22', title: 'Department Planning', type: 'school', time: '08:30 AM' },
    { id: 105, date: '2026-07-29', title: 'Lesson Plan Preparation', type: 'personal', time: '10:00 AM' }
];

// DOM Element Selectors
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('monthLabel');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const selectedEvents = document.getElementById('selectedEvents');
const monthEventCount = document.getElementById('monthEventCount');
const schoolCount = document.getElementById('schoolCount');
const personalCount = document.getElementById('personalCount');
const eventForm = document.getElementById('eventForm');
const eventIdInput = document.getElementById('eventId');
const eventTitle = document.getElementById('eventTitle');
const eventType = document.getElementById('eventType');
const eventTime = document.getElementById('eventTime');
const addEventBtn = document.getElementById('addEventBtn');
const cancelEventBtn = document.getElementById('cancelEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');

let currentDate = new Date(2026, 6, 1);
let selectedDate = new Date(2026, 6, 18);

// Configure form options based on logged-in role
function configureRoleOptions() {
    if (!eventType) return;
    eventType.innerHTML = '';
    if (currentUserRole === 'principal' || currentUserRole === 'admin') {
        eventType.innerHTML = `
            <option value="school">Schoolwide / Master Schedule (All Faculty)</option>
            <option value="personal">Personal Event (Principal Private)</option>
        `;
    } else {
        // Regular Teacher Access
        eventType.innerHTML = `
            <option value="personal">Personal Event (Visible only to you)</option>
        `;
    }
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getEventsForDate(dateKey) {
    return events.filter((event) => event.date === dateKey);
}

function renderCalendar() {
    if (!calendarGrid) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstWeekday = firstDay.getDay();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    monthLabel.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';

    const todayKey = formatDateKey(new Date());
    const selectedKey = formatDateKey(selectedDate);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthEvents = events.filter((event) => event.date.startsWith(monthKey));
    
    monthEventCount.textContent = monthEvents.length;
    schoolCount.textContent = monthEvents.filter((e) => e.type === 'school').length;
    personalCount.textContent = monthEvents.filter((e) => e.type === 'personal').length;

    for (let i = 0; i < totalCells; i += 1) {
        const dayNumber = i - firstWeekday + 1;
        const cellDate = new Date(year, month, dayNumber);
        const isCurrentMonth = cellDate.getMonth() === month;
        const cellKey = formatDateKey(cellDate);
        const isToday = cellKey === todayKey;
        const isSelected = cellKey === selectedKey;

        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day${isCurrentMonth ? '' : ' disabled'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`;
        dayEl.innerHTML = `
            <div class="date-row">
                <span class="date-number">${isCurrentMonth ? cellDate.getDate() : ''}</span>
                ${isToday ? '<span class="today-pill">Today</span>' : ''}
            </div>
        `;

        if (isCurrentMonth) {
            const eventList = getEventsForDate(cellKey);
            eventList.slice(0, 2).forEach((event) => {
                const pill = document.createElement('div');
                pill.className = `event-pill event-${event.type}`;
                pill.textContent = event.title;
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedDate = cellDate;
                    renderCalendar();
                    updateSelectedEvents();
                });
                dayEl.appendChild(pill);
            });
            if (eventList.length > 2) {
                const more = document.createElement('div');
                more.className = 'event-pill event-more';
                more.textContent = `+${eventList.length - 2} more`;
                dayEl.appendChild(more);
            }
        }

        dayEl.addEventListener('click', () => {
            if (!isCurrentMonth) return;
            selectedDate = cellDate;
            renderCalendar();
            updateSelectedEvents();
        });

        calendarGrid.appendChild(dayEl);
    }

    updateSelectedEvents();
}

function updateSelectedEvents() {
    if (!selectedEvents) return;
    const key = formatDateKey(selectedDate);
    const list = getEventsForDate(key);
    selectedDateLabel.textContent = formatDisplayDate(selectedDate);
    
    if (list.length === 0) {
        selectedEvents.innerHTML = '<div class="empty-state">No events scheduled for this day.</div>';
        return;
    }

    selectedEvents.innerHTML = list.map((event) => {
        // Check if current user has permission to edit this specific event
        const isEditable = currentUserRole === 'principal' || currentUserRole === 'admin' || event.type === 'personal';
        
        return `
            <div class="detail-card" style="position: relative; padding: 0.85rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem;">
                <div class="detail-card-title" style="font-weight: 700; color: #0f172a;">${event.title}</div>
                <div class="detail-card-meta" style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                    ${event.time || 'All day'} &bull; <span class="badge-${event.type}">${event.type === 'school' ? 'Schoolwide' : 'Personal'}</span>
                </div>
                ${isEditable ? `
                    <button onclick="editEvent(${event.id})" style="position: absolute; right: 0.75rem; top: 0.75rem; background: none; border: none; color: #0038A8; cursor: pointer;">
                        <i class="fas fa-pen-to-square"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function editEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    eventIdInput.value = ev.id;
    eventTitle.value = ev.title;
    eventTime.value = ev.time;
    eventType.value = ev.type;
    
    document.getElementById('formHeader').textContent = 'Edit Event Details';
    deleteEventBtn.classList.remove('hidden');
    eventForm.classList.remove('hidden');
}

// Event Listeners Initializer
document.addEventListener('DOMContentLoaded', () => {
    configureRoleOptions();
    renderCalendar();

    if (document.getElementById('prevMonthBtn')) {
        document.getElementById('prevMonthBtn').addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            renderCalendar();
        });
    }

    if (document.getElementById('nextMonthBtn')) {
        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            renderCalendar();
        });
    }

    if (document.getElementById('todayBtn')) {
        document.getElementById('todayBtn').addEventListener('click', () => {
            currentDate = new Date();
            selectedDate = new Date();
            renderCalendar();
        });
    }

    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            eventIdInput.value = '';
            eventTitle.value = '';
            eventTime.value = '';
            configureRoleOptions();
            document.getElementById('formHeader').textContent = 'Create New Event';
            deleteEventBtn.classList.add('hidden');
            eventForm.classList.remove('hidden');
            eventTitle.focus();
        });
    }

    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', () => {
            eventForm.classList.add('hidden');
        });
    }

    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => {
            const id = parseInt(eventIdInput.value);
            events = events.filter(e => e.id !== id);
            eventForm.classList.add('hidden');
            renderCalendar();
        });
    }

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!eventTitle.value.trim()) return;

            const existingId = eventIdInput.value;
            if (existingId) {
                const ev = events.find(item => item.id === parseInt(existingId));
                if (ev) {
                    ev.title = eventTitle.value.trim();
                    ev.type = eventType.value;
                    ev.time = eventTime.value.trim() || 'All day';
                }
            } else {
                events.push({
                    id: Date.now(),
                    date: formatDateKey(selectedDate),
                    title: eventTitle.value.trim(),
                    type: eventType.value,
                    time: eventTime.value.trim() || 'All day'
                });
            }

            eventForm.classList.add('hidden');
            renderCalendar();
        });
    }
});