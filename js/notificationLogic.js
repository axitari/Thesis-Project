/**
 * Notifications Management Logic
 * Kandili Workspace - Central Activity Log
 */

let notifications = [
    {
        id: 'notif-1',
        icon: 'fas fa-file-invoice',
        theme: 'icon-blue',
        title: 'New eSF7 Workload Draft Submitted',
        text: 'Teacher Maria Santos submitted a revised instructional program draft for administrative review.',
        time: 'Just now',
        unread: true
    },
    {
        id: 'notif-2',
        icon: 'fas fa-triangle-exclamation',
        theme: 'icon-red',
        title: 'Burnout Threshold Warning',
        text: 'Faculty code TCH-012 triggered High Emotional Exhaustion (EE) benchmark (>27). Task rebalancing advised.',
        time: '18m ago',
        unread: true
    },
    {
        id: 'notif-3',
        icon: 'fas fa-shield-heart',
        theme: 'icon-purple',
        title: 'Simulator Relief Applied',
        text: 'Workload reallocation was successfully exported for Grade 9 Rizal Advisory duty offloading.',
        time: '1h ago',
        unread: true
    },
    {
        id: 'notif-4',
        icon: 'fas fa-calendar-check',
        theme: 'icon-amber',
        title: 'Upcoming Academic Review Cycle',
        text: 'DepEd Division Office scheduled the Mid-Year Magna Carta load validation next Monday at 9:00 AM.',
        time: 'Yesterday',
        unread: false
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initNotificationsFeed();
    initTopNavActions();
    initLogoutHandler();
});

function initNotificationsFeed() {
    // Dynamically point sidebar dashboard link according to active user role
    const userRole = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
    const dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
        dashLink.href = userRole === 'teacher' ? '../teacher/teacherdashboard.html' : '../principal/principaldashboard.html';
    }

    renderNotificationItems();
    updateBadges();

    // Mark all as read button
    document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
        notifications.forEach(n => n.unread = false);
        renderNotificationItems();
        updateBadges();
    });
}

function initTopNavActions() {
    const backBtn = document.getElementById('navBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check stored role (defaults to principal)
            const role = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
            const destination = (role === 'teacher') 
                ? '../teacher/teacherdashboard.html' 
                : '../principal/principaldashboard.html';

            window.location.href = destination;
        });
    }

    const refreshBtn = document.getElementById('navRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

    document.getElementById('navRefreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });
}

function renderNotificationItems() {
    const listContainer = document.getElementById('notificationListContainer');
    if (!listContainer) return;

    if (notifications.length === 0) {
        listContainer.innerHTML = `
            <div class="notification-empty-state">
                <i class="far fa-bell-slash"></i>
                <p>No activity notifications at this time.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notification-icon-wrapper ${notif.theme}">
                <i class="${notif.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <p class="notification-text">${notif.text}</p>
            </div>
            <span class="notification-time">${notif.time}</span>
        </div>
    `).join('');

    // Clicking an item marks it as read
    listContainer.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const target = notifications.find(n => n.id === id);
            if (target && target.unread) {
                target.unread = false;
                renderNotificationItems();
                updateBadges();
            }
        });
    });
}

function updateBadges() {
    const unreadCount = notifications.filter(n => n.unread).length;
    const topBadge = document.getElementById('unreadCountBadge');
    const sideBadge = document.getElementById('sidebarNotificationBadge');

    [topBadge, sideBadge].forEach(badge => {
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
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