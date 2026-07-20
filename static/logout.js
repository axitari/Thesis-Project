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

    try {
        if (window.supabaseClient?.auth?.signOut) {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) {
                console.error('Logout failed:', error.message);
            }
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
    } catch (error) {
        console.warn('Could not clear browser storage:', error);
    }

    window.location.href = 'login.html';
    return false; // prevent the <a> tag's default navigation from also firing
}