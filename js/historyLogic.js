/**
 * Activity History Logic & Search Engine
 * Kandili Workspace - General Activity Ledger
 */

document.addEventListener('DOMContentLoaded', () => {
    initHistoryCenter();
    initTopNavActions();
    initFilterHandlers();
    initLogoutHandler();
});

function initHistoryCenter() {
    // Dynamic dashboard link in sidebar
    const userRole = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
    const dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
        dashLink.href = userRole === 'teacher' ? '../teacher/teacherdashboard.html' : '../principal/principaldashboard.html';
    }
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

function initFilterHandlers() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterType');

    searchBtn?.addEventListener('click', filterLogs);
    resetBtn?.addEventListener('click', resetLogs);
    filterSelect?.addEventListener('change', filterLogs);

    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') filterLogs();
    });
}

function filterLogs() {
    const input = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const type = document.getElementById('filterType')?.value || 'all';
    const items = document.querySelectorAll('.history-item');
    let visibleCount = 0;

    items.forEach(item => {
        const text = ((item.getAttribute('data-keywords') || '') + ' ' + item.textContent).toLowerCase();
        const matchesText = !input || text.includes(input);
        const matchesType = type === 'all' || item.getAttribute('data-category') === type;
        const shouldShow = matchesText && matchesType;

        item.style.display = shouldShow ? 'flex' : 'none';
        if (shouldShow) visibleCount++;
    });

    const emptyBox = document.getElementById('historyEmpty');
    if (emptyBox) {
        emptyBox.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function resetLogs() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterType');

    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';

    document.querySelectorAll('.history-item').forEach(item => {
        item.style.display = 'flex';
    });

    const emptyBox = document.getElementById('historyEmpty');
    if (emptyBox) emptyBox.style.display = 'none';
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