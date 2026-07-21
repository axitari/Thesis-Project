// static/settings.js — Kandili Settings Page Logic

document.addEventListener('DOMContentLoaded', () => {
    initSettingsPage();
});

async function initSettingsPage() {
    await loadAccountInfo();
    loadNotificationPreferences();
    initPasswordStrengthMeter();
    initPasswordMatchChecker();
    initPasswordChangeForm();
    initDashboardNavigationLinks();
}

// ==========================================================
// DASHBOARD NAVIGATION LINKS
// ==========================================================
async function initDashboardNavigationLinks() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            const userId = session.user.id;
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profile) {
                const role = profile.role;
                const navDashboard = document.getElementById('navDashboard');
                const navProfile = document.getElementById('navProfile');

                if (role === 'teacher') {
                    navDashboard.href = 'teacherdashboard.html';
                    navProfile.href = 'teacherprofilepage.html';
                } else if (role === 'principal') {
                    navDashboard.href = 'principaldashboard.html';
                    navProfile.href = 'principalprofilepage.html';
                } else if (role === 'admin') {
                    navDashboard.href = 'admindashboard.html';
                    navProfile.href = 'principalprofilepage.html';
                }
            }
        }
    } catch (err) {
        console.warn('Could not set navigation links:', err);
    }
}

// ==========================================================
// ACCOUNT INFORMATION
// ==========================================================
async function loadAccountInfo() {
    try {
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError || !session) return;

        const user = session.user;

        // Display email
        document.getElementById('accountEmail').textContent = user.email || 'Not available';

        // Fetch profile from profiles table
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('role, created_at, last_login')
            .eq('id', user.id)
            .single();

        if (!profileError && profile) {
            // Role
            const roleEl = document.getElementById('accountRole');
            roleEl.textContent = profile.role
                ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                : 'User';

            // Member since
            const memberEl = document.getElementById('memberSince');
            if (profile.created_at) {
                memberEl.textContent = new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            } else {
                memberEl.textContent = 'Not available';
            }

            // Last login
            const lastLoginEl = document.getElementById('lastLogin');
            if (profile.last_login) {
                lastLoginEl.textContent = new Date(profile.last_login).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                });
            } else {
                lastLoginEl.textContent = user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })
                    : 'Not available';
            }
        } else {
            document.getElementById('accountRole').textContent = 'User';
            document.getElementById('memberSince').textContent = 'Not available';
            document.getElementById('lastLogin').textContent = user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })
                : 'Not available';
        }
    } catch (err) {
        console.warn('Could not load account info:', err);
    }
}

// ==========================================================
// PASSWORD STRENGTH METER
// ==========================================================
function initPasswordStrengthMeter() {
    const passwordInput = document.getElementById('newPassword');
    if (!passwordInput) return;

    const bars = ['sbar1', 'sbar2', 'sbar3', 'sbar4'].map(id => document.getElementById(id));
    const strengthLabel = document.getElementById('strengthLabel');

    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        let score = 0;

        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        // Reset all bars
        bars.forEach(bar => {
            if (bar) bar.style.backgroundColor = 'var(--border-color, #cbd5e1)';
        });

        if (val.length === 0) {
            strengthLabel.textContent = 'Password strength';
            strengthLabel.style.color = 'var(--text-muted, #64748b)';
            return;
        }

        const activeBars = bars.slice(0, score);
        let color = 'var(--deped-red, #C8102E)';
        let text = 'Weak';

        if (score === 2) { color = '#f59e0b'; text = 'Fair'; }
        else if (score === 3) { color = '#3b82f6'; text = 'Good'; }
        else if (score >= 4) { color = '#059669'; text = 'Strong'; }
        else { text = 'Weak'; }

        activeBars.forEach(bar => {
            if (bar) bar.style.backgroundColor = color;
        });

        strengthLabel.textContent = text;
        strengthLabel.style.color = color;
    });
}

// ==========================================================
// PASSWORD MATCH CHECKER
// ==========================================================
function initPasswordMatchChecker() {
    const newPass = document.getElementById('newPassword');
    const confirmPass = document.getElementById('confirmPassword');
    const hint = document.getElementById('passwordMatchHint');
    if (!newPass || !confirmPass || !hint) return;

    function checkMatch() {
        if (!confirmPass.value) {
            hint.textContent = '';
            hint.className = 'password-match-hint';
            return;
        }
        if (newPass.value === confirmPass.value) {
            hint.textContent = '✓ Passwords match';
            hint.className = 'password-match-hint match-success';
        } else {
            hint.textContent = '✗ Passwords do not match';
            hint.className = 'password-match-hint match-error';
        }
    }

    newPass.addEventListener('input', checkMatch);
    confirmPass.addEventListener('input', checkMatch);
}

// ==========================================================
// CHANGE PASSWORD FORM
// ==========================================================
function initPasswordChangeForm() {
    const form = document.getElementById('passwordChangeForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const feedback = document.getElementById('passwordFeedback');
        const submitBtn = document.getElementById('submitPasswordBtn');

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!currentPassword) {
            showFeedback(feedback, 'Please enter your current password.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showFeedback(feedback, 'New password must be at least 8 characters.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showFeedback(feedback, 'New passwords do not match.', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            showFeedback(feedback, 'New password must be different from your current password.', 'error');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        showFeedback(feedback, '', '');
        feedback.className = 'settings-feedback';

        try {
            // First re-authenticate by signing in again with current password
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                showFeedback(feedback, 'Session expired. Please log in again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Update Password';
                return;
            }

            const email = session.user.email;

            // Re-authenticate to verify current password
            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: currentPassword
            });

            if (signInError) {
                showFeedback(feedback, 'Current password is incorrect. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Update Password';
                return;
            }

            // Update password
            const { error: updateError } = await window.supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                console.error('Password update error:', updateError.message);
                showFeedback(feedback, 'Failed to update password: ' + updateError.message, 'error');
            } else {
                showFeedback(feedback, '✓ Password updated successfully!', 'success');
                form.reset();
                // Reset strength meter
                ['sbar1', 'sbar2', 'sbar3', 'sbar4'].forEach(id => {
                    const bar = document.getElementById(id);
                    if (bar) bar.style.backgroundColor = 'var(--border-color, #cbd5e1)';
                });
                document.getElementById('strengthLabel').textContent = 'Password strength';
                document.getElementById('strengthLabel').style.color = 'var(--text-muted, #64748b)';
            }
        } catch (err) {
            console.error('Password change error:', err);
            showFeedback(feedback, 'An unexpected error occurred. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Update Password';
        }
    });

    // Reset handler
    const resetBtn = form.querySelector('button[type="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const feedback = document.getElementById('passwordFeedback');
            feedback.className = 'settings-feedback';
            feedback.textContent = '';
            ['sbar1', 'sbar2', 'sbar3', 'sbar4'].forEach(id => {
                const bar = document.getElementById(id);
                if (bar) bar.style.backgroundColor = 'var(--border-color, #cbd5e1)';
            });
            document.getElementById('strengthLabel').textContent = 'Password strength';
            document.getElementById('strengthLabel').style.color = 'var(--text-muted, #64748b)';
            const hint = document.getElementById('passwordMatchHint');
            if (hint) { hint.textContent = ''; hint.className = 'password-match-hint'; }
        });
    }
}

// ==========================================================
// NOTIFICATION PREFERENCES (localStorage)
// ==========================================================
function loadNotificationPreferences() {
    const prefs = [
        'notifPulse',
        'notifWorkload',
        'notifMessages',
        'notifAnnouncements',
        'notifAssessment'
    ];

    prefs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const saved = localStorage.getItem('kandili_notif_' + id);
            if (saved !== null) {
                el.checked = saved === 'true';
            }
        }
    });
}

function saveNotificationPreferences() {
    const prefs = [
        'notifPulse',
        'notifWorkload',
        'notifMessages',
        'notifAnnouncements',
        'notifAssessment'
    ];

    prefs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            localStorage.setItem('kandili_notif_' + id, String(el.checked));
        }
    });

    const feedback = document.getElementById('notifFeedback');
    showFeedback(feedback, '✓ Notification preferences saved successfully!', 'success');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (feedback) {
            feedback.className = 'settings-feedback';
            feedback.textContent = '';
        }
    }, 3000);
}

// ==========================================================
// LOG OUT ALL DEVICES
// ==========================================================
async function logoutAllDevices() {
    const confirmed = confirm(
        'This will sign you out from all active sessions across all devices. You will need to log in again. Continue?'
    );

    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('You have been logged out of all devices. Redirecting to login...');
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error('Logout all devices error:', err);
        alert('An error occurred. Please try again.');
    }
}

// ==========================================================
// HELPER FUNCTIONS
// ==========================================================
function showFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = 'settings-feedback';
    if (type === 'success') {
        element.classList.add('feedback-success');
    } else if (type === 'error') {
        element.classList.add('feedback-error');
    }
}

