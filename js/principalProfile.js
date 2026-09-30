/**
 * Principal Profile Controller
 * Kandili Workspace - Profile Management Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLogoutHandler();
    initPhotoPicker();
    initEditProfileModal();
});

/* ==========================================================================
   1. Navigation & Role-Aware Routing
   ========================================================================== */
function initNavigation() {
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        window.location.reload();
    });

    // Back button
    document.getElementById('navBackBtn')?.addEventListener('click', () => {
        if (document.referrer && document.referrer.toLowerCase().includes('principaldashboard')) {
            window.location.href = 'principaldashboard.html';
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'principaldashboard.html';
        }
    });

    // Activity Log Review Button
    document.getElementById('btnReviewActivityLog')?.addEventListener('click', () => {
        window.location.href = '../general/history.html?origin=principal';
    });
}

/* ==========================================================================
   2. Authentication & Logout Handler
   ========================================================================== */
function initLogoutHandler() {
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof kandiliLogout === 'function') {
            kandiliLogout();
        } else if (confirm("Are you sure you want to log out?")) {
            window.location.href = "../login.html";
        }
    });
}

/* ==========================================================================
   3. Photo Upload Operations
   ========================================================================== */
function initPhotoPicker() {
    const photoInput = document.getElementById('avatarFileInput');
    const openPhotoBtn = document.getElementById('updatePhotoBtn');
    const badgePhotoBtn = document.getElementById('avatarBadgeBtn');
    const imageDisplay = document.getElementById('profileImageDisplay');

    const triggerPhotoPicker = () => photoInput?.click();
    openPhotoBtn?.addEventListener('click', triggerPhotoPicker);
    badgePhotoBtn?.addEventListener('click', triggerPhotoPicker);

    photoInput?.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (imageDisplay) {
                    imageDisplay.src = e.target.result;
                }
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

/* ==========================================================================
   4. Edit Profile Modal Operations
   ========================================================================== */
function initEditProfileModal() {
    const editModal = document.getElementById('editProfileModal');
    const openEditBtn = document.getElementById('editProfileBtn');
    const closeEditBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editProfileForm');

    const toggleModal = (show) => {
        if (!editModal) return;
        if (show) {
            // Populate form with current values
            document.getElementById('editFullName').value = document.getElementById('displayFullName')?.textContent.trim() || '';
            document.getElementById('editRoleTitle').value = document.getElementById('displayRoleTitle')?.textContent.trim() || '';
            document.getElementById('editEmail').value = document.getElementById('displayEmail')?.textContent.trim() || '';
            document.getElementById('editContact').value = document.getElementById('displayContact')?.textContent.trim() || '';
            document.getElementById('editDegree').value = document.getElementById('displayDegree')?.textContent.trim() || '';
            
            editModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            editModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    openEditBtn?.addEventListener('click', () => toggleModal(true));
    closeEditBtn?.addEventListener('click', () => toggleModal(false));
    cancelEditBtn?.addEventListener('click', () => toggleModal(false));

    editModal?.addEventListener('click', (e) => {
        if (e.target === editModal) toggleModal(false);
    });

    editForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        // Extract values
        const name = document.getElementById('editFullName').value;
        const role = document.getElementById('editRoleTitle').value;
        const email = document.getElementById('editEmail').value;
        const contact = document.getElementById('editContact').value;
        const degree = document.getElementById('editDegree').value;

        // Update presentation elements
        const nameElem = document.getElementById('displayFullName');
        const roleElem = document.getElementById('displayRoleTitle');
        const emailElem = document.getElementById('displayEmail');
        const contactElem = document.getElementById('displayContact');
        const degreeElem = document.getElementById('displayDegree');

        if (nameElem) nameElem.textContent = name;
        if (roleElem) roleElem.textContent = role;
        if (emailElem) emailElem.textContent = email;
        if (contactElem) contactElem.textContent = contact;
        if (degreeElem) degreeElem.textContent = degree;

        toggleModal(false);
    });
}