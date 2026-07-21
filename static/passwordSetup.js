// static/passwordSetup.js

document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.querySelector('form');

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('password')?.value || passwordForm.querySelector('input[type="password"]')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;

            if (confirmPassword && newPassword !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            // Update user password in Supabase Auth
            const { error } = await window.supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error("Password update error:", error.message);
                alert("Failed to update password: " + error.message);
            } else {
                alert("Password set successfully! Redirecting to login...");
                window.location.href = "login.html";
            }
        });
    }
});