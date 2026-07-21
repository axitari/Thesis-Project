// static/principalProfile.js

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        const nameHeading = document.querySelector('.profile-header h2, .user-name');
        const emailLabel = document.querySelector('.profile-email, .user-email');
        const roleBadge = document.querySelector('.role-badge');

        if (nameHeading) nameHeading.innerText = `${profile.first_name || ''} ${profile.last_name || ''}`;
        if (emailLabel) emailLabel.innerText = session.user.email;
        if (roleBadge) roleBadge.innerText = (profile.role || 'Principal').toUpperCase();
    }
});