// static/messageLogic.js

document.addEventListener('DOMContentLoaded', async () => {
    await populateRecipientDropdown();
    await loadInboxMessages();
    setupComposeForm();
});

// 1. Populate Recipients Dropdown
async function populateRecipientDropdown() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('id, first_name, last_name, role, department')
            .neq('id', session.user.id);

        if (error) {
            console.error("Error loading recipients:", error.message);
            return;
        }

        const recipientInput = document.getElementById('recipient');
        if (!recipientInput) return;

        const select = document.createElement('select');
        select.id = 'recipient';
        select.style.cssText = 'width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem;';

        select.innerHTML = `<option value="">-- Select Recipient --</option>`;
        profiles.forEach(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            const displayName = fullName ? `${fullName} (${(p.role || '').toUpperCase()})` : `User (${(p.role || '').toUpperCase()})`;
            select.innerHTML += `<option value="${p.id}">${displayName}</option>`;
        });

        recipientInput.parentNode.replaceChild(select, recipientInput);
    } catch (err) {
        console.error("Failed to populate recipients:", err);
    }
}

// 2. Load Inbox Messages
async function loadInboxMessages() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        // Step A: Fetch messages where user is recipient
        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select('*')
            .eq('recipient_id', session.user.id)
            .order('created_at', { ascending: false });

        const messageList = document.querySelector('.message-list');
        if (!messageList) return;

        messageList.innerHTML = '';

        if (error) {
            console.error("Error loading inbox messages:", error.message);
            messageList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #ef4444;">Failed to load messages.</div>`;
            return;
        }

        if (!messages || messages.length === 0) {
            messageList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #64748b;">No received messages in your inbox.</div>`;
            return;
        }

        // Step B: Fetch sender profiles
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: senders } = await window.supabaseClient
            .from('profiles')
            .select('id, first_name, last_name, role')
            .in('id', senderIds);

        const senderMap = {};
        if (senders) {
            senders.forEach(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                if (fullName.length > 0) {
                    senderMap[s.id] = fullName;
                } else if (s.role) {
                    senderMap[s.id] = `${s.role.toUpperCase()} User`;
                } else {
                    senderMap[s.id] = "School Staff";
                }
            });
        }

        // Render Cards
        messages.forEach(msg => {
            const senderName = senderMap[msg.sender_id] || 'School Staff';
            const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = `message-item ${msg.is_read ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="message-meta">
                    <strong>${senderName}</strong>
                    <span>${formattedTime}</span>
                </div>
                <p>${msg.content}</p>
            `;
            messageList.appendChild(item);
        });
    } catch (err) {
        console.error("Failed to fetch inbox:", err);
    }
}

// 3. Setup Compose Form
function setupComposeForm() {
    const form = document.querySelector('.message-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const recipientSelect = document.getElementById('recipient');
        const messageText = document.getElementById('message')?.value.trim();
        const recipientId = recipientSelect?.value;

        if (!recipientId || !messageText) {
            alert("Please select a recipient and enter a message.");
            return;
        }

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        const { error } = await window.supabaseClient
            .from('messages')
            .insert({
                sender_id: session.user.id,
                recipient_id: recipientId,
                content: messageText
            });

        submitBtn.innerText = "Send Message";
        submitBtn.disabled = false;

        if (error) {
            alert("Failed to send message: " + error.message);
        } else {
            alert("Message sent successfully!");
            document.getElementById('message').value = '';
            if (document.getElementById('subject')) document.getElementById('subject').value = '';
            await loadInboxMessages();
        }
    });
}