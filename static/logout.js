// static/logout.js
//
// Replaces the old pattern of:
//   <a href="login.html" onclick="return confirm('Are you sure you want to log out?');">Log Out</a>
// which never actually ended the session.
//
// New usage in the nav bar:
//   <a href="#" onclick="return kandiliLogout();">Log Out</a>
//
// Requires supabaseClient.js to be loaded first.

async function kandiliLogout() {
    if (!confirm('Are you sure you want to log out?')) {
        return false;
    }

    const { error } = await window.supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout failed:", error.message);
        alert("Something went wrong logging out: " + error.message);
        return false;
    }

    window.location.href = 'login.html';
    return false; // prevent the <a> tag's default navigation from also firing
}