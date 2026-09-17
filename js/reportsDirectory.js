/**
 * Faculty Workload Reports Directory Logic
 * Handles real-time search, status tier filtering, and counter updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    initReportsDirectoryFilter();
    initLogoutHandler();
});

function initReportsDirectoryFilter() {
    const searchInput = document.getElementById('directorySearch');
    const statusSelect = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', executeDirectoryFilter);
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', executeDirectoryFilter);
    }
}

function executeDirectoryFilter() {
    const searchVal = (document.getElementById('directorySearch')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter')?.value || 'all';
    const rows = document.querySelectorAll('#directoryTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.querySelector('.cell-name')?.textContent.toLowerCase() || '';
        const code = row.querySelector('.cell-code')?.textContent.toLowerCase() || '';
        const dept = row.querySelector('.cell-dept')?.textContent.toLowerCase() || '';
        const tier = row.getAttribute('data-tier') || '';

        const matchesQuery = !searchVal || name.includes(searchVal) || code.includes(searchVal) || dept.includes(searchVal);
        const matchesTier = statusVal === 'all' || tier === statusVal;

        if (matchesQuery && matchesTier) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Update Counter Badge
    const counter = document.getElementById('visibleReportCount');
    if (counter) {
        counter.textContent = visibleCount;
    }

    // Toggle Empty Feedback Box
    const emptyBox = document.getElementById('noDirectoryResults');
    if (emptyBox) {
        emptyBox.style.display = visibleCount === 0 ? 'block' : 'none';
    }
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