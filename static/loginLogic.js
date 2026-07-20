// static/loginLogic.js

const loginForm = document.getElementById('loginForm');

const roleToDashboard = {
    'teacher': 'teacherdashboard.html',
    'principal': 'principaldashboard.html',
    'admin': 'admindashboard.html'
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const selectedDashboard = document.getElementById('role').value; // e.g. "teacherdashboard.html"

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login failed:", error.message);
        alert("Error: " + error.message);
        return;
    }

    // Pull verified profile information from security environment
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

    const normalizedRole = (profile.role || '').trim().toLowerCase();
    const correctDashboard = roleToDashboard[normalizedRole];

    // STRICT CROSS-VERIFICATION VALIDATION
    if (selectedDashboard !== correctDashboard) {
        console.warn(`Role Mismatch: Selected "${selectedDashboard}" but database dictates "${correctDashboard}".`);
        alert("Login Error: The selected role does not match your authorized account profile details.");
        
        // Log out user instantly to destroy mismatched active session state
        await window.supabaseClient.auth.signOut();
        return;
    }

    console.log("Login verified successfully! Redirecting to authorized domain.");
    window.location.href = correctDashboard;
});