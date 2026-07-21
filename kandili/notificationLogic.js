// static/notificationLogic.js

document.addEventListener('DOMContentLoaded', async () => {
    await loadNotifications();
});

async function loadNotifications() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const { data: notifications, error } = await window.supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    const container = document.querySelector('.notification-list, .notifications-container');
    if (!container) return;

    container.innerHTML = '';

    if (error || !notifications || notifications.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #64748b;">No recent notifications.</div>`;
        return;
    }

    notifications.forEach(item => {
        const card = document.createElement('div');
        card.className = `notification-card ${item.is_read ? 'read' : 'unread'}`;
        card.style.cssText = `padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; border-left: 4px solid ${
            item.type === 'urgent' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#3b82f6'
        }; background: ${item.is_read ? '#f8fafc' : '#ffffff'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">${item.title}</h4>
                <span style="font-size: 0.75rem; color: #94a3b8;">${new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #475569;">${item.message}</p>
        `;

        container.appendChild(card);
    });
}