/**
 * Anonymized Burnout Reports Directory Logic
 * Kandili Workspace - Privacy-Protected MBI-ES Filtering
 */

document.addEventListener('DOMContentLoaded', () => {
    initBurnoutFilter();
    initLogoutHandler();
});

function initBurnoutFilter() {
    const searchInput = document.getElementById('burnoutSearch');
    const tierSelect = document.getElementById('burnoutTierFilter');

    if (searchInput) {
        searchInput.addEventListener('input', executeBurnoutFilter);
    }

    if (tierSelect) {
        tierSelect.addEventListener('change', executeBurnoutFilter);
    }
}

function executeBurnoutFilter() {
    const searchVal = (document.getElementById('burnoutSearch')?.value || '').toLowerCase().trim();
    const tierVal = document.getElementById('burnoutTierFilter')?.value || 'all';
    const rows = document.querySelectorAll('#burnoutTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const code = row.querySelector('.cell-code')?.textContent.toLowerCase() || '';
        const tier = row.getAttribute('data-tier') || '';

        const matchesQuery = !searchVal || code.includes(searchVal);
        const matchesTier = tierVal === 'all' || tier === tierVal;

        if (matchesQuery && matchesTier) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Update Counter Badge
    const counter = document.getElementById('visibleBurnoutCount');
    if (counter) {
        counter.textContent = visibleCount;
    }

    // Toggle Empty Feedback Box
    const emptyBox = document.getElementById('noBurnoutResults');
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