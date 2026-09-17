/**
 * Faculty Directory UI & Filter Logic
 * Handles real-time search, tag-based filtering, empty states, and counter syncing.
 */

let currentTagFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initDirectorySearch();
    initFilterPills();
    initLogoutHandler();
});

/**
 * Attaches real-time typing events to search bar
 */
function initDirectorySearch() {
    const searchInput = document.getElementById('facultySearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterDirectory);
    }
}

/**
 * Filters directory cards by text query and current tag filter
 */
function filterDirectory() {
    const query = (document.getElementById('facultySearch')?.value || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.faculty-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const name = card.querySelector('.faculty-name')?.textContent.toLowerCase() || '';
        const role = card.querySelector('.faculty-role')?.textContent.toLowerCase() || '';
        const tags = (card.getAttribute('data-tags') || '').toLowerCase();

        const matchesQuery = !query || name.includes(query) || role.includes(query) || tags.includes(query);
        const matchesTag = currentTagFilter === 'all' || tags.includes(currentTagFilter.toLowerCase());

        if (matchesQuery && matchesTag) {
            card.style.display = "flex";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    // Update active results counter
    const counter = document.getElementById('facultyCounter');
    if (counter) counter.textContent = visibleCount;

    // Toggle empty state display
    const emptyState = document.getElementById('noResultsState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? "block" : "none";
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
        } else if (confirm("Are you sure you want to log out?")) {
            window.location.href = "../login.html";
        }
    });
}