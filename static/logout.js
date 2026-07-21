// static/logout.js

async function handleLogout(event) {
    if (event) event.preventDefault();

    const confirmLogout = confirm('Are you sure you want to log out?');
    if (!confirmLogout) return false;

    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error("Logout error:", error.message);
            alert("Error signing out: " + error.message);
        } else {
            console.log("User successfully logged out.");
        }
    } catch (err) {
        console.error("Unexpected logout failure:", err);
    } finally {
        window.location.href = "login.html";
    }
}

// Global window alias so inline onclick="return kandiliLogout(event)" or onclick="kandiliLogout()" works seamlessly
window.kandiliLogout = handleLogout;

document.addEventListener('DOMContentLoaded', () => {
    const logoutElements = document.querySelectorAll('#logoutLink, .btn-logout, a[href="login.html"]');
    logoutElements.forEach(element => {
        element.removeAttribute('onclick');
        element.addEventListener('click', handleLogout);
    });
});