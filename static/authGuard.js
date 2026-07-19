// static/authGuard.js
//
// Include this on every page that should require login, AFTER supabaseClient.js:
//
//   <script src="../static/supabaseClient.js"></script>
//   <script src="../static/authGuard.js" data-allowed-roles="teacher,master teacher"></script>
//
// If data-allowed-roles is omitted, the guard only checks that SOMEONE is
// logged in (any role). If it's set, only those roles may view the page —
// everyone else gets redirected to THEIR OWN correct dashboard (not just
// bounced to login), since a mismatched role usually means "wrong page for
// you," not "you're not logged in."
//
// Role comparisons are case-insensitive (matches the lowercase convention
// used elsewhere in this app, e.g. "teacher" not "Teacher").

const KANDILI_ROLE_HOME = {
    'teacher': 'teacherdashboard.html',
    'principal': 'principaldashboard.html',
    'admin': 'admindashboard.html'
};

(async function guardPage() {
    const scriptTag = document.currentScript;
    const allowedRolesAttr = scriptTag ? scriptTag.getAttribute('data-allowed-roles') : null;
    const allowedRoles = allowedRolesAttr
        ? allowedRolesAttr.split(',').map(r => r.trim().toLowerCase())
        : null;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    if (!allowedRoles) {
        // No specific role required — just being logged in is enough.
        return;
    }

    const { data: profile, error } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error || !profile) {
        console.error("Could not verify user profile:", error ? error.message : "no profile row");
        window.location.href = 'login.html';
        return;
    }

    const normalizedRole = (profile.role || '').trim().toLowerCase();

    if (!allowedRoles.includes(normalizedRole)) {
        console.warn(`Unauthorized access attempt: user role "${profile.role}" tried to view a page requiring [${allowedRoles.join(', ')}]`);

        const theirHome = KANDILI_ROLE_HOME[normalizedRole];
        if (theirHome) {
            alert("You don't have access to that page — redirecting you to your dashboard.");
            window.location.href = theirHome;
        } else {
            // Unrecognized role entirely — safest fallback is login, not a guess.
            alert("You don't have access to this page.");
            window.location.href = 'login.html';
        }
    }
})();