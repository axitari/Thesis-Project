// static/authGuard.js

async function checkAuthAndRole(requiredRole) {
    // Hide body immediately while checking auth to prevent UI flash
    document.body.classList.add('protected-page');

    // 1. Check active session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
        console.warn("No active session. Redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    const userId = session.user.id;

    // 2. Fetch role from profiles
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

    // 3. Check role authorization
    if (requiredRole !== 'any' && profile.role !== requiredRole) {
        console.warn(`Unauthorized Access. User is a ${profile.role}, required ${requiredRole}.`);
        
        if (profile.role === 'teacher') {
            window.location.href = "teacherdashboard.html";
        } else if (profile.role === 'principal') {
            window.location.href = "principaldashboard.html";
        } else if (profile.role === 'admin') {
            window.location.href = "admindashboard.html";
        } else {
            window.location.href = "login.html";
        }
        return;
    }

    // Verification PASSED! Safe to reveal the page
    document.body.classList.remove('protected-page');
    document.body.style.display = 'block';
}

// Live Real-Time Header Clock & Calendar
function initRealtimeHeaderClock() {
    function updateClock() {
        const dateElement = document.querySelector('.theme-nav__date');
        if (!dateElement) return;

        const now = new Date();
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateString} | ${timeString}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeHeaderClock);
} else {
    initRealtimeHeaderClock();
}