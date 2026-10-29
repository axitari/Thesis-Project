/**
 * Faculty Directory UI & Real-Time Supabase Controller
 * Fetches verified faculty profiles from Supabase and handles client-side filtering.
 */

let currentTagFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch & Render Live Faculty Records from Supabase
    await loadFacultyDirectory();

    // 2. Initialize Real-Time Search & Category Filters
    initDirectorySearch();
    initFilterPills();
    initLogoutHandler();
});

/**
 * Queries Supabase 'profiles' table for all users with role = 'teacher'
 * and renders responsive faculty cards into #facultyGrid.
 */
async function loadFacultyDirectory() {
    const grid = document.getElementById('facultyGrid');
    const counter = document.getElementById('facultyCounter');
    if (!grid) return;

    try {
        if (!window.supabaseClient) {
            console.error('[FacultyDirectory] Supabase client is not initialized.');
            return;
        }

        // Fetch verified teachers ordered alphabetically by last name
        const { data: teachers, error } = await window.supabaseClient
            .from('profiles')
            .select('id, first_name, last_name, role, department, grade_level, advisory_class, teacher_code')
            .eq('role', 'teacher')
            .order('last_name', { ascending: true });

        if (error) {
            console.error('[FacultyDirectory] Supabase query error:', error.message);
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #ef4444;">
                    <i class="fas fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>Error loading faculty records</h3>
                    <p style="color: #64748b;">${error.message}</p>
                </div>
            `;
            if (counter) counter.textContent = '0';
            return;
        }

        // Clear existing mock/placeholder cards
        grid.innerHTML = '';

        if (!teachers || teachers.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-users-slash" style="font-size: 2.5rem; margin-bottom: 1rem; color: #94a3b8; display: block;"></i>
                    <h3>No faculty records found</h3>
                    <p>No registered teachers currently exist in the school directory.</p>
                </div>
            `;
            if (counter) counter.textContent = '0';
            return;
        }

        if (counter) counter.textContent = teachers.length;

        const avatarColors = ['avatar-blue', 'avatar-purple', 'avatar-green', 'avatar-amber'];

        teachers.forEach((teacher, index) => {
            const firstName = teacher.first_name || '';
            const lastName = teacher.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Faculty Teacher';
            const teacherCode = teacher.teacher_code || `TCH-${String(index + 1).padStart(3, '0')}`;
            const grade = teacher.grade_level || 'Grade 2';
            const advisory = teacher.advisory_class || 'Self-Contained';
            const dept = teacher.department || 'General Education';

            // Generate clean initials for avatar
            const firstInitial = firstName ? firstName[0].toUpperCase() : 'T';
            const lastInitial = lastName ? lastName[0].toUpperCase() : 'C';
            const initials = `${firstInitial}${lastInitial}`;
            const colorClass = avatarColors[index % avatarColors.length];

            // Card search tags
            const tags = `${grade} ${advisory} ${dept} ${teacherCode}`.trim();
            const roleText = teacher.advisory_class ? `Adviser: ${teacher.advisory_class}` : `${dept} Teacher`;

            const card = document.createElement('div');
            card.className = 'faculty-card';
            card.setAttribute('data-tags', tags);
            card.setAttribute('data-name', fullName);
            card.setAttribute('data-role', roleText);

            card.innerHTML = `
                <div class="faculty-avatar-wrapper">
                    <div class="faculty-avatar ${colorClass}">${initials}</div>
                    <span class="status-indicator online" title="Status: Active"></span>
                </div>
                <div class="faculty-info">
                    <div class="faculty-name">${fullName}</div>
                    <div class="faculty-role"><i class="fas fa-chalkboard-user"></i> ${roleText}</div>
                    <div class="faculty-meta"><i class="fas fa-id-badge"></i> ${teacherCode} &bull; ${grade} &bull; ${dept}</div>
                </div>
                <button class="faculty-action btn-view-program" type="button" onclick="window.location.href='../teacher/classprogram.html?teacherId=${teacher.id}'">
                    <span>View Class Program</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            `;

            grid.appendChild(card);
        });

    } catch (err) {
        console.error('[FacultyDirectory] Unexpected exception:', err);
    }
}

/**
 * Attaches real-time search typing listener to #facultySearch
 */
function initDirectorySearch() {
    const searchInput = document.getElementById('facultySearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterDirectory);
    }
}

/**
 * Filters directory cards by text query and active tag filter
 */
function filterDirectory() {
    const query = (document.getElementById('facultySearch')?.value || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#facultyGrid .faculty-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const role = (card.getAttribute('data-role') || '').toLowerCase();
        const tags = (card.getAttribute('data-tags') || '').toLowerCase();

        const matchesQuery = !query || name.includes(query) || role.includes(query) || tags.includes(query);
        const matchesTag = currentTagFilter === 'all' || tags.includes(currentTagFilter.toLowerCase());

        if (matchesQuery && matchesTag) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Update active results counter
    const counter = document.getElementById('facultyCounter');
    if (counter) counter.textContent = visibleCount;

    // Toggle empty state display
    const emptyState = document.getElementById('noResultsState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

/**
 * Initializes button tag filters (All Faculty, Grade 2, SSES)
 */
function initFilterPills() {
    const filterButtons = document.querySelectorAll('.filter-pill');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentTagFilter = this.getAttribute('data-filter') || 'all';
            filterDirectory();
        });
    });
}

/**
 * Sidebar logout handler
 */
function initLogoutHandler() {
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm('Are you sure you want to log out?')) {
            window.location.href = '../general/login.html';
        }
    });
}

