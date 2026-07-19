// static/teacherDashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verify Session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    
    // If no session, authGuard.js handles it
    if (sessionError || !session) return; 

    const userId = session.user.id;

    // 2. Fetch and Display Profile Data Automatically
    async function loadProfile() {
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        // Automatically inject the data into the welcome banner if names exist in the database
        if (profile.first_name && profile.last_name) {
            document.getElementById('welcome-message').innerText = `Welcome back, ${profile.first_name} ${profile.last_name}`;
        }
    }

    // Execute the fetch immediately on load
    loadProfile();
});