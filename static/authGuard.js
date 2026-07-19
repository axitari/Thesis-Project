// static/authGuard.js

async function checkAuthAndRole(requiredRole) {
    // 1. Check if there is an active session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
        console.warn("No active session. Redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    const userId = session.user.id;

    // 2. Fetch the user's actual role from the profiles table
    const { data: profile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        console.error("Could not verify user profile.");
        window.location.href = "login.html";
        return;
    }

    // 3. Check if the user's role matches the required role for this page
    if (requiredRole !== 'any' && profile.role !== requiredRole) {
        console.warn(`Unauthorized Access. User is a ${profile.role}, required ${requiredRole}.`);
        
        // Kick them to their proper dashboard
        if (profile.role === 'teacher') window.location.href = "teacherdashboard.html";
        else if (profile.role === 'principal') window.location.href = "principaldashboard.html";
        else if (profile.role === 'admin') window.location.href = "admindashboard.html";
    }
}