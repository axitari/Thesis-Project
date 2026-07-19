// static/authGuard.js
//
// Include this on every page that should require login, AFTER supabaseClient.js:
//
//   <script src="../static/supabaseClient.js"></script>
//   <script src="../static/authGuard.js" data-allowed-roles="Teacher,Master Teacher"></script>
//
// If data-allowed-roles is omitted, the guard only checks that SOMEONE is
// logged in (any role). If it's set, only those exact role values may view
// the page — everyone else gets bounced back to login.
//
// Role values used elsewhere in this app: "Teacher", "Master Teacher",
// "Principal", "Admin".

(async function guardPage() {
    const scriptTag = document.currentScript;
    const allowedRolesAttr = scriptTag ? scriptTag.getAttribute('data-allowed-roles') : null;
    const allowedRoles = allowedRolesAttr
        ? allowedRolesAttr.split(',').map(r => r.trim())
        : null;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    if (allowedRoles) {
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error || !profile || !allowedRoles.includes(profile.role)) {
            alert("You don't have access to this page.");
            window.location.href = 'login.html';
        }
    }
})();