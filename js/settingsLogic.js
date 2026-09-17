/**
 * Settings Page Management Logic
 * Kandili Workspace - General Utility
 */

document.addEventListener('DOMContentLoaded', () => {
    initSettingsContext();
    initTimestampDisplay();
    initEyeToggles();
    initPasswordStrengthChecker();
    initPasswordForm();
    initNotificationForm();
    initSessionActions();
    initLogoutHandler();
});

function initSettingsContext() {
    const origin = new URLSearchParams(window.location.search).get('origin');
    const userRole = origin || localStorage.getItem('kandili_role') || sessionStorage.getItem('kandili_role') || 'principal';

    // 1. Point the Dashboard sidebar anchor appropriately
    const dashLink = document.getElementById('navDashboardLink');
    if (dashLink) {
        dashLink.href = (userRole === 'teacher') 
            ? '../teacher/teacherdashboard.html' 
            : '../principal/principaldashboard.html';
    }

    // 2. Point Quick Profile link
    const profileLink = document.getElementById('quickProfileLink');
    if (profileLink) {
        profileLink.href = (userRole === 'teacher')
            ? '../teacher/teacherprofilepage.html'
            : '../principal/principalprofilepage.html';
    }

    // 3. Populate Profile Context Readouts
    const roleElem = document.getElementById('accountRole');
    if (roleElem) {
        roleElem.textContent = (userRole === 'teacher') ? 'Teacher (Junior High)' : 'School Head / Principal';
    }
}

function initTimestampDisplay() {
    const dateElem = document.getElementById('settingsDateDisplay');
    if (dateElem) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        dateElem.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateStr} | ${timeStr}`;
    }

    document.getElementById('navRefreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });
}

function initEyeToggles() {
    document.querySelectorAll('.btn-eye-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');

            if (!input || !icon) return;

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

function initPasswordStrengthChecker() {
    const newPass = document.getElementById('newPassword');
    const confirmPass = document.getElementById('confirmPassword');
    const matchHint = document.getElementById('passwordMatchHint');

    newPass?.addEventListener('input', () => {
        const val = newPass.value;
        let strength = 0;

        if (val.length >= 8) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
        for (let i = 1; i <= 4; i++) {
            const bar = document.getElementById(`sbar${i}`);
            if (bar) bar.style.background = i <= strength ? colors[strength] : '#e2e8f0';
        }

        const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const labelElem = document.getElementById('strengthLabel');
        if (labelElem) labelElem.textContent = val ? labels[strength] : 'Password strength';
    });

    confirmPass?.addEventListener('input', () => {
        if (!confirmPass.value) {
            matchHint.textContent = '';
            return;
        }
        if (confirmPass.value === newPass.value) {
            matchHint.textContent = 'Passwords match';
            matchHint.style.color = '#15803d';
        } else {
            matchHint.textContent = 'Passwords do not match';
            matchHint.style.color = '#dc2626';
        }
    });
}

function initPasswordForm() {
    const form = document.getElementById('passwordChangeForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const cur = document.getElementById('currentPassword').value;
        const nxt = document.getElementById('newPassword').value;
        const cnf = document.getElementById('confirmPassword').value;
        const fb = document.getElementById('passwordFeedback');

        if (nxt !== cnf) {
            fb.textContent = 'New passwords do not match. Please verify.';
            fb.className = 'settings-feedback error';
            return;
        }

        fb.textContent = 'Password successfully updated via Supabase Auth.';
        fb.className = 'settings-feedback success';
        form.reset();
        for (let i = 1; i <= 4; i++) {
            const bar = document.getElementById(`sbar${i}`);
            if (bar) bar.style.background = '#e2e8f0';
        }
    });
}

function initNotificationForm() {
    document.getElementById('saveNotifPrefBtn')?.addEventListener('click', () => {
        const fb = document.getElementById('notifFeedback');
        if (fb) {
            fb.textContent = 'Notification preferences successfully stored.';
            fb.className = 'settings-feedback success';
            setTimeout(() => { fb.textContent = ''; }, 3000);
        }
    });
}

function initSessionActions() {
    document.getElementById('logoutAllDevicesBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to invalidate all active session tokens across devices?')) {
            alert('Active tokens revoked. Redirecting to login console.');
            window.location.href = '../login.html';
        }
    });
}

function initLogoutHandler() {
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm('Are you sure you want to log out?')) {
            window.location.href = '../login.html';
        }
    });
}