/**
 * Messages Center Logic & Data Ingestion
 * Kandili Workspace - DepEd Cross-Role Communication
 */

let currentTab = 'inbox';

const mockMessages = {
    inbox: [
        {
            id: 'msg-1',
            sender: 'Mylene Panaguiton (Principal II)',
            role: 'School Leadership',
            subject: 'eSF7 Workload Balance Consultation',
            snippet: 'Greetings! We reviewed your mid-year load audit and would like to coordinate regarding ancillary task reallocations...',
            body: 'Greetings!\n\nWe reviewed your mid-year load audit and noticed your total weekly quantified hours exceed statutory limits under Magna Carta guidelines. We would like to coordinate regarding ancillary task reallocations to prevent instructional fatigue.\n\nPlease drop by the principal console room during your vacant period this Thursday.\n\nWarm regards,\nMylene Panaguiton',
            timestamp: 'July 20, 2026 | 10:15 AM',
            unread: true
        },
        {
            id: 'msg-2',
            sender: 'LAC Coordinator (Science Dept)',
            role: 'Department Head',
            subject: 'Upcoming Session Materials Preparation',
            snippet: 'Please ensure that lesson exemplars for Quarter 3 are uploaded to the shared repository prior to our Friday session...',
            body: 'Dear Colleagues,\n\nPlease ensure that lesson exemplars for Quarter 3 are uploaded to the shared repository prior to our Friday session. We will focus on hands-on laboratory adjustments.\n\nThank you,\nScience Department',
            timestamp: 'July 19, 2026 | 3:45 PM',
            unread: false
        }
    ],
    sent: [
        {
            id: 'msg-3',
            sender: 'Me (To: School Head)',
            role: 'Self',
            subject: 'Request for Co-Adviser Support',
            snippet: 'Submitting formal request for secondary support on Form 137 documentation for Grade 9 Section Rizal...',
            body: 'Dear Principal Panaguiton,\n\nI am submitting a formal request for secondary support on Form 137 documentation for Grade 9 Section Rizal. The current student load requires additional administrative coordination.\n\nRespectfully,\nFaculty Member',
            timestamp: 'July 18, 2026 | 11:20 AM',
            unread: false
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    initMessageCenter();
    initTopNavActions();
    initComposeForm();
    initModalControls();
    initLogoutHandler();
});

function initMessageCenter() {
    // Determine dynamic dashboard target based on active role
    const userRole = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
    const dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
        dashLink.href = userRole === 'teacher' ? '../teacher/teacherdashboard.html' : '../principal/principaldashboard.html';
    }

    // Attach Tab switches
    document.getElementById('tabInboxBtn')?.addEventListener('click', () => switchMessageTab('inbox'));
    document.getElementById('tabSentBtn')?.addEventListener('click', () => switchMessageTab('sent'));
    document.getElementById('refreshMessagesBtn')?.addEventListener('click', () => renderMessageList());

    renderMessageList();
    updateUnreadBadges();
}

function initTopNavActions() {
    const backBtn = document.getElementById('navBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Detect user role from local or session storage
            const role = localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';
            const defaultFallback = role === 'teacher' 
                ? '../teacher/teacherdashboard.html' 
                : '../principal/principaldashboard.html';

            // Check if there is actual browsing history to return to
            if (window.history.length > 1 && document.referrer && !document.referrer.includes('login.html')) {
                window.history.back();
            } else {
                window.location.href = defaultFallback;
            }
        });
    }

    const refreshBtn = document.getElementById('navRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

function switchMessageTab(tabName) {
    currentTab = tabName;

    const inboxBtn = document.getElementById('tabInboxBtn');
    const sentBtn = document.getElementById('tabSentBtn');

    if (tabName === 'inbox') {
        inboxBtn?.classList.add('active');
        sentBtn?.classList.remove('active');
    } else {
        sentBtn?.classList.add('active');
        inboxBtn?.classList.remove('active');
    }

    renderMessageList();
}

function renderMessageList() {
    const listContainer = document.getElementById('messageListContainer');
    if (!listContainer) return;

    const messages = mockMessages[currentTab] || [];

    if (messages.length === 0) {
        listContainer.innerHTML = `
            <div class="message-empty-placeholder">
                <i class="fas fa-inbox"></i>
                <p>No messages found in this folder.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = messages.map(msg => `
        <div class="message-item ${msg.unread ? 'unread' : ''}" data-id="${msg.id}">
            <div class="message-item-top">
                <span class="message-item-sender">${msg.sender}</span>
                <span class="message-item-time">${msg.timestamp}</span>
            </div>
            <div class="message-item-subject">${msg.subject}</div>
            <div class="message-item-snippet">${msg.snippet}</div>
        </div>
    `).join('');

    // Attach click triggers to open message modal
    listContainer.querySelectorAll('.message-item').forEach(card => {
        card.addEventListener('click', () => {
            const msgId = card.getAttribute('data-id');
            openMessageModal(msgId);
        });
    });
}

function openMessageModal(messageId) {
    const message = [...mockMessages.inbox, ...mockMessages.sent].find(m => m.id === messageId);
    if (!message) return;

    // Mark as read
    message.unread = false;
    updateUnreadBadges();
    renderMessageList();

    // Populate modal
    document.getElementById('modalSender').textContent = message.sender;
    document.getElementById('modalRole').textContent = message.role;
    document.getElementById('modalTime').textContent = message.timestamp;
    document.getElementById('modalSubject').textContent = message.subject;
    document.getElementById('modalBody').textContent = message.body;

    const modal = document.getElementById('messageModal');
    if (modal) modal.classList.add('active');
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) modal.classList.remove('active');
}

function initModalControls() {
    document.getElementById('closeModalIconBtn')?.addEventListener('click', closeMessageModal);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeMessageModal);

    // Close on overlay backdrop click
    const modal = document.getElementById('messageModal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeMessageModal();
    });
}

function updateUnreadBadges() {
    const unreadCount = mockMessages.inbox.filter(m => m.unread).length;

    const unreadBadge = document.getElementById('unreadBadge');
    const sidebarBadge = document.getElementById('sidebarUnreadBadge');
    const inboxBadge = document.getElementById('inboxTabBadge');

    [unreadBadge, sidebarBadge, inboxBadge].forEach(badge => {
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    });
}

function initComposeForm() {
    const form = document.getElementById('composeMessageForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const recipientSelect = document.getElementById('recipient');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');

        const newMsg = {
            id: `msg-${Date.now()}`,
            sender: 'Me',
            role: 'Self',
            subject: subjectInput.value.trim(),
            snippet: messageInput.value.trim().substring(0, 90) + '...',
            body: messageInput.value.trim(),
            timestamp: 'Just now',
            unread: false
        };

        mockMessages.sent.unshift(newMsg);
        alert('Message successfully transmitted through DepEd secure channel.');
        form.reset();

        if (currentTab === 'sent') {
            renderMessageList();
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