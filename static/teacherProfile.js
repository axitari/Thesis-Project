// static/teacherProfile.js

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Authenticate and get User Info
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) return; 

    const userId = session.user.id;
    const userEmail = session.user.email;

    document.getElementById('display-email').innerText = userEmail;
    // 2. Fetch Profile Data from Database
    async function loadProfile() {
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        // Update the display text for core fields
        if (profile.first_name || profile.last_name) {
            document.getElementById('display-name').innerText = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
        } else {
            document.getElementById('display-name').innerText = "New Teacher";
        }
        
        if (profile.role) {
            document.getElementById('display-role').innerText = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
        }

        // Inject data into display IDs, falling back to "Not set" if null
        document.getElementById('display-deped').innerText = profile.deped_employee_id || "Not set";
        document.getElementById('display-plantilla').innerText = profile.plantilla_item_no || "Not set";
        document.getElementById('display-prc').innerText = profile.prc_license_no || "Not set";
        document.getElementById('display-status').innerText = profile.employment_status || "Not set";
        document.getElementById('display-years').innerText = profile.years_in_service !== null ? `${profile.years_in_service} Years` : "Not set";
        
        document.getElementById('display-institution').innerText = profile.assigned_institution || "Not set";
        document.getElementById('display-department').innerText = profile.department || "Not set";
        document.getElementById('display-advisory').innerText = profile.advisory_class || "Not set";
        
        document.getElementById('display-education').innerText = profile.educational_attainment || "Not set";
        document.getElementById('display-contact').innerText = profile.contact_number || "Not set";

        // Update Pill Badges in Header
        document.getElementById('display-department-pill').innerText = profile.department || "No Department";
        document.getElementById('display-advisory-pill').innerText = profile.advisory_class || "No Advisory";

        // Pre-fill the hidden form inputs for editing
        document.getElementById('input-firstName').value = profile.first_name || "";
        document.getElementById('input-lastName').value = profile.last_name || "";
        document.getElementById('input-depedId').value = profile.deped_employee_id || "";
        document.getElementById('input-plantilla').value = profile.plantilla_item_no || "";
        document.getElementById('input-prc').value = profile.prc_license_no || "";
        document.getElementById('input-status').value = profile.employment_status || "";
        document.getElementById('input-years').value = profile.years_in_service || "";
        document.getElementById('input-institution').value = profile.assigned_institution || "";
        document.getElementById('input-department').value = profile.department || "";
        document.getElementById('input-advisory').value = profile.advisory_class || "";
        document.getElementById('input-education').value = profile.educational_attainment || "";
        document.getElementById('input-contact').value = profile.contact_number || "";
    }

    // Run immediately on page load
    loadProfile();

    // 3. Toggle the Edit Form
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editSection = document.getElementById('edit-profile-section');

    editBtn.addEventListener('click', () => {
        editSection.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        editSection.style.display = 'none';
    });

    // 4. Handle Form Submission
    const editForm = document.getElementById('editProfileForm');
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather all inputs
        const updatedData = {
            first_name: document.getElementById('input-firstName').value,
            last_name: document.getElementById('input-lastName').value,
            deped_employee_id: document.getElementById('input-depedId').value,
            plantilla_item_no: document.getElementById('input-plantilla').value,
            prc_license_no: document.getElementById('input-prc').value,
            employment_status: document.getElementById('input-status').value,
            years_in_service: document.getElementById('input-years').value ? parseInt(document.getElementById('input-years').value) : null,
            assigned_institution: document.getElementById('input-institution').value,
            department: document.getElementById('input-department').value,
            advisory_class: document.getElementById('input-advisory').value,
            educational_attainment: document.getElementById('input-education').value,
            contact_number: document.getElementById('input-contact').value
        };

        const { error } = await window.supabaseClient
            .from('profiles')
            .update(updatedData)
            .eq('id', userId);

        if (error) {
            console.error("Update failed:", error);
            alert("Could not update profile: " + error.message);
        } else {
            editSection.style.display = 'none';
            loadProfile(); // Refresh UI instantly
            alert("Profile successfully updated!");
        }
    });
});