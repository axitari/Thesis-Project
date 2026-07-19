// static/loginLogic.js

// static/loginLogic.js

const loginForm = document.getElementById('loginForm');

// Maps the role STORED IN THE DATABASE to the page it should land on.
// Keys are lowercase — the lookup below normalizes profile.role to lowercase
// before matching, so this works regardless of how the role was capitalized
// when it was written (e.g. "Teacher", "teacher", "TEACHER" all match).
const roleToDashboard = {
    'teacher': 'teacherdashboard.html',
    'principal': 'principaldashboard.html',
    'admin': 'admindashboard.html'
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login failed:", error.message);
        alert("Error: " + error.message);
        return;
    }

    // Look up the REAL role from the profiles table — never trust the
    // login form's role dropdown for this.
    const { data: profile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) {
        console.error("Could not load profile:", profileError ? profileError.message : "no profile row found");
        alert("Login succeeded, but we couldn't find your profile. Please contact an administrator.");
        return;
    }

    console.log("Login successful! Role from DB:", profile.role);

    const normalizedRole = (profile.role || '').trim().toLowerCase();
    const destination = roleToDashboard[normalizedRole];

    if (!destination) {
        console.warn(`Unrecognized role "${profile.role}" — add it to roleToDashboard if this is a valid role.`);
        alert(`Your account role ("${profile.role}") isn't recognized by the app yet. Please contact an administrator.`);
        return;
    }

    window.location.href = destination;
});