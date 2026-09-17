/**
 * Teacher Dashboard UI Logic
 * Handles sidebar syncing, modals, role-switching, and file uploads
 */

document.addEventListener('DOMContentLoaded', () => {
    initFileUpload();
    initSidebarActiveSync();
    initPulseCheckinModal();
    initAdjustmentModal();
    initLeaveModal();
    initNavigationAndLogout();
    initAdminConsoleSwitch();
});

/* ==========================================================================
   1. File Upload Indicator
   ========================================================================== */
function initFileUpload() {
    const fileInput = document.getElementById('classProgramFile');
    const fileDisplay = document.getElementById('fileDisplay');
    
    if (fileInput && fileDisplay) {
        fileInput.addEventListener('change', function () {
            fileDisplay.textContent = (this.files && this.files.length > 0)
                ? this.files[0].name
                : 'No file chosen';
        });
    }
}

/* ==========================================================================
   2. Sidebar Smooth Scroll & Active Link Sync
   ========================================================================== */
function initSidebarActiveSync() {
    const sidebarLinks = document.querySelectorAll('.app-sidebar-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

/* ==========================================================================
   3. Modal Visibility Helper
   ========================================================================== */
function toggleModal(modal, show = true) {
    if (!modal) return;
    if (show) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ==========================================================================
   4. Pulse Check-in Modal
   ========================================================================== */
function initPulseCheckinModal() {
    const modal = document.getElementById('wellnessCheckinModal');
    const openBtn = document.getElementById('openPulseModalBtn');
    const closeBtn = document.getElementById('wellnessCloseBtn');
    const submitBtn = document.getElementById('submitWellnessBtn');
    const fullRiskBtn = document.getElementById('completeCheckinBtn');
    const snoozeBtn = document.getElementById('remindLaterBtn');

    if (openBtn) openBtn.addEventListener('click', () => toggleModal(modal, true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleModal(modal, false));

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            alert('Pulse check-in recorded. Thank you!');
            toggleModal(modal, false);
        });
    }

    if (snoozeBtn) {
        snoozeBtn.addEventListener('click', () => {
            const timeVal = document.getElementById('pulseRemindSelect')?.value || '60';
            alert(`Reminder snoozed for ${timeVal} minutes.`);
            toggleModal(modal, false);
        });
    }

    if (fullRiskBtn) {
        fullRiskBtn.addEventListener('click', () => {
            toggleModal(modal, false);
            window.location.href = 'burnout-risk_assessment.html';
        });
    }
}

/* ==========================================================================
   5. Workload Adjustment Modal & Searchable Select
   ========================================================================== */
function initAdjustmentModal() {
    const modal = document.getElementById('requestAdjustmentModal');
    const openBtn = document.getElementById('requestAdjustmentBtn');
    const closeBtn = document.getElementById('adjModalCloseBtn');
    const cancelBtn = document.getElementById('cancelAdjustmentBtn');
    const submitBtn = document.getElementById('submitAdjustmentBtn');

    const searchInput = document.getElementById('proposedAssigneeInput');
    const dropdown = document.getElementById('assigneeDropdown');
    const wrapper = document.querySelector('.searchable-select-wrapper');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            toggleModal(modal, true);
            const dateInput = document.getElementById('effectiveDateInput');
            if (dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => toggleModal(modal, false));
    if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(modal, false));

    if (searchInput && dropdown && wrapper) {
        searchInput.addEventListener('focus', () => {
            dropdown.classList.add('open');
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;
            searchInput.value = item.textContent.trim();
            dropdown.classList.remove('open');
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const duty = document.getElementById('targetDutySelect')?.value;
            const assignee = searchInput?.value;
            const remarks = document.getElementById('justificationTextarea')?.value;

            if (!remarks || remarks.trim() === '') {
                alert('Please provide justification remarks before submitting.');
                return;
            }

            alert(`Adjustment request submitted for ${duty} to ${assignee}.`);
            toggleModal(modal, false);
        });
    }
}

/* ==========================================================================
   6. Leave Request Modal
   ========================================================================== */
function initLeaveModal() {
    const modal = document.getElementById('requestLeaveModal');
    const openBtn = document.getElementById('openLeaveModalBtn');
    const closeBtn = document.getElementById('leaveModalCloseBtn');
    const cancelBtn = document.getElementById('cancelLeaveBtn');
    const submitBtn = document.getElementById('submitLeaveBtn');

    if (openBtn) openBtn.addEventListener('click', () => toggleModal(modal, true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleModal(modal, false));
    if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(modal, false));

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const startDate = document.getElementById('leaveStartDate')?.value;
            const endDate = document.getElementById('leaveEndDate')?.value;

            if (!startDate || !endDate) {
                alert('Please specify both the start and end dates.');
                return;
            }

            alert('Absence/Leave request submitted for review.');
            toggleModal(modal, false);
        });
    }
}

/* ==========================================================================
   7. Navigation & Logout Handlers
   ========================================================================== */
function initNavigationAndLogout() {
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm("Are you sure you want to log out?")) {
            window.location.href = "../login.html";
        }
    });

    document.getElementById('takeAssessmentBtn')?.addEventListener('click', () => {
        window.location.href = 'burnout-risk_assessment.html';
    });

    document.getElementById('viewAnalyticsBtn')?.addEventListener('click', () => {
        window.location.href = 'teacher_analytics.html';
    });

    document.getElementById('openFullReportBtn')?.addEventListener('click', () => {
        window.location.href = 'teacher_report.html';
    });
}

/* ==========================================================================
   8. Principal-to-Teacher Switcher Verification
   ========================================================================== */
function initAdminConsoleSwitch() {
    const adminBtn = document.getElementById('adminSwitchBtn');
    if (!adminBtn) return;

    // Check A: Query Param (Direct transition from Principal Dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('viewAs') === 'principal') {
        sessionStorage.setItem('kandili_viewing_as_teacher', 'true');
        adminBtn.style.setProperty('display', 'inline-flex', 'important');
        return;
    }

    // Check B: Session Storage (Persists as they click around teacher tabs)
    if (sessionStorage.getItem('kandili_viewing_as_teacher') === 'true') {
        adminBtn.style.setProperty('display', 'inline-flex', 'important');
        return;
    }

    // Check C: Stored Role
    const storedRole = (localStorage.getItem('user_role') || sessionStorage.getItem('user_role') || '').toLowerCase();
    if (storedRole === 'principal') {
        adminBtn.style.setProperty('display', 'inline-flex', 'important');
    }
}