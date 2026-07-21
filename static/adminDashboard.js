// static/adminDashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Load
    await loadFacultyDirectory();
    
    // 2. Setup Refresh Button
    const refreshBtn = document.querySelector('.theme-nav__refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Refreshing...`;
            await loadFacultyDirectory();
            refreshBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Refresh`;
        });
    }

    // 3. Setup Add Teacher Drawer Form Submission
    setupAddTeacherForm();
});

async function loadFacultyDirectory() {
    try {
        // Fetch profiles along with their teaching and ancillary loads
        const { data: profiles, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select(`
                id,
                first_name,
                last_name,
                role,
                department,
                teaching_loads ( minutes_per_week ),
                ancillary_duties ( hours_per_week )
            `);

        if (profileError) {
            console.error("Error fetching faculty profiles:", profileError.message);
            return;
        }

        const tableBody = document.querySelector('.admin-table-section .reallocation-table tbody');
        if (!tableBody) return;

        // Clear hardcoded static rows
        tableBody.innerHTML = '';

        let overloadedCount = 0;
        let maximizedCount = 0;
        let optimalCount = 0;

        profiles.forEach((profile, index) => {
            // Calculate Total Hours (Teaching Mins -> Hours + Ancillary Hours)
            const teachingMins = profile.teaching_loads?.reduce((sum, item) => sum + (item.minutes_per_week || 0), 0) || 0;
            const teachingHrs = teachingMins / 60;
            const ancillaryHrs = profile.ancillary_duties?.reduce((sum, item) => sum + parseFloat(item.hours_per_week || 0), 0) || 0;
            
            const totalWorkloadHrs = (teachingHrs + ancillaryHrs).toFixed(1);

            // Determine Workload Status (DepEd RA 4670 Threshold Rules)
            let statusBadge = '';
            if (totalWorkloadHrs > 30) { // Over DepEd 30-hour limit
                statusBadge = `<span class="status-overload">OVERLOAD</span>`;
                overloadedCount++;
            } else if (totalWorkloadHrs >= 25) {
                statusBadge = `<span class="status-active">MAXIMIZED</span>`;
                maximizedCount++;
            } else {
                statusBadge = `<span class="status-pending">OPTIMAL</span>`;
                optimalCount++;
            }

            // Generate Teacher Code ID
            const teacherCode = `TCH2026-${String(index + 1).padStart(3, '0')}`;
            const fullName = `${profile.last_name || ''}, ${profile.first_name || 'Faculty'}`;
            const department = profile.department || 'Not Assigned';

            // Construct Dynamic HTML Table Row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${teacherCode}</td>
                <td><span class="admin-teacher-name">${fullName}</span></td>
                <td>${profile.role ? profile.role.toUpperCase() : 'TEACHER'}</td>
                <td>${department}</td>
                <td><span class="admin-load-value">${totalWorkloadHrs} hrs</span></td>
                <td>${statusBadge}</td>
                <td><button class="action-btn action-btn--simulate" onclick="manageUser('${profile.id}')">Manage</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Update Risk Summary Cards dynamically
        updateRiskCards(overloadedCount, maximizedCount, optimalCount);

    } catch (err) {
        console.error("Failed to load admin directory:", err);
    }
}

function updateRiskCards(overloaded, maximized, optimal) {
    const criticalCard = document.querySelector('.risk-card--critical .risk-card-number');
    const moderateCard = document.querySelector('.risk-card--moderate .risk-card-number');
    const lowCard = document.querySelector('.risk-card--low .risk-card-number');

    if (criticalCard) criticalCard.innerText = overloaded;
    if (moderateCard) moderateCard.innerText = maximized;
    if (lowCard) lowCard.innerText = optimal;
}

function setupAddTeacherForm() {
    const drawerPanel = document.getElementById('teacherDrawer');
    if (!drawerPanel) return;

    const saveButton = drawerPanel.querySelector('.btn-primary');
    const cancelButton = drawerPanel.querySelector('.btn-secondary');

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            drawerPanel.classList.remove('active');
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();

            const inputs = drawerPanel.querySelectorAll('input[type="text"]');
            const select = drawerPanel.querySelector('select');

            const firstName = inputs[0]?.value.trim();
            const lastName = inputs[1]?.value.trim();
            const email = inputs[2]?.value.trim();
            const department = select?.value;

            if (!email || !firstName || !lastName) {
                alert("Please fill in all required fields.");
                return;
            }

            saveButton.innerText = "Creating Account...";
            saveButton.disabled = true;

            // 1. SAVE THE ADMIN'S SESSION SO WE DON'T LOSE IT
            const { data: { session: currentAdminSession } } = await window.supabaseClient.auth.getSession();

            // 2. Create the user
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: "TempPassword2026!", // Temporary onboarding password
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: 'teacher',
                        department: department
                    }
                }
            });

            if (error) {
                alert("Failed to create teacher: " + error.message);
                saveButton.innerText = "Save & Send Invitation";
                saveButton.disabled = false;
                return;
            }

            // 3. RESTORE THE ADMIN'S SESSION IMMEDIATELY
            if (currentAdminSession) {
                await window.supabaseClient.auth.setSession({
                    access_token: currentAdminSession.access_token,
                    refresh_token: currentAdminSession.refresh_token
                });
            }

            alert(`Teacher profile created successfully for ${firstName} ${lastName}!`);
            
            // Clear input fields
            inputs.forEach(input => input.value = '');
            
            saveButton.innerText = "Save & Send Invitation";
            saveButton.disabled = false;
            drawerPanel.classList.remove('active');

            // 4. Reload full directory under Admin session
            await loadFacultyDirectory();
        });
    }
}

function manageUser(userId) {
    alert("User Management for ID: " + userId + "\nThis action opens detail configurations.");
}