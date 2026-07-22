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

    // 3. Setup Drawer Open/Close via body listener
    setupDrawerToggle();

    // 4. Auto-generate teacher code when drawer opens
    setupTeacherCodeGeneration();

    // 5. Setup Password Generate button
    setupPasswordGenerator();

    // 6. Setup Add Teacher Drawer Form Submission
    setupAddTeacherForm();
});

/* ============================================================
   DRAWER TOGGLE (Open / Close)
   ============================================================ */
function setupDrawerToggle() {
    const teacherDrawer = document.getElementById('teacherDrawer');
    const openTeacherButtons = document.querySelectorAll('.open-teacher-drawer');
    const closeTeacherDrawer = document.getElementById('closeTeacherDrawer');
    const cancelTeacherDrawerBtn = document.getElementById('cancelTeacherDrawerBtn');

    if (!teacherDrawer) return;

    openTeacherButtons.forEach(button => {
        button.addEventListener('click', () => {
            teacherDrawer.classList.add('active');
            // Auto-generate teacher code when opening
            generateTeacherCode();
        });
    });

    if (closeTeacherDrawer) {
        closeTeacherDrawer.addEventListener('click', () => {
            teacherDrawer.classList.remove('active');
        });
    }

    if (cancelTeacherDrawerBtn) {
        cancelTeacherDrawerBtn.addEventListener('click', () => {
            teacherDrawer.classList.remove('active');
        });
    }

    teacherDrawer.addEventListener('click', (event) => {
        if (event.target === teacherDrawer) {
            teacherDrawer.classList.remove('active');
        }
    });
}

/* ============================================================
   TEACHER CODE AUTO-GENERATION
   ============================================================ */
function setupTeacherCodeGeneration() {
    const generateCodeBtn = document.getElementById('generateTeacherCodeBtn');
    if (generateCodeBtn) {
        generateCodeBtn.addEventListener('click', generateTeacherCode);
    }
}

async function generateTeacherCode() {
    const teacherCodeInput = document.getElementById('teacherCode');
    if (!teacherCodeInput) return;

    const currentYear = new Date().getFullYear();
    const prefix = `TCH${currentYear}-`;

    try {
        const { data: existingCodes, error } = await window.supabaseClient
            .from('profiles')
            .select('teacher_code')
            .eq('role', 'teacher')
            .not('teacher_code', 'is', null);

        const usedCodes = new Set();
        if (!error && existingCodes) {
            existingCodes.forEach(item => {
                if (item.teacher_code) {
                    usedCodes.add(item.teacher_code.trim());
                }
            });
        }

        let code;
        let attempts = 0;
        do {
            const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            code = `${prefix}${suffix}`;
            attempts += 1;
        } while (usedCodes.has(code) && attempts < 20);

        teacherCodeInput.value = code;
    } catch (err) {
        console.error("Failed to generate teacher code:", err);
        teacherCodeInput.value = `TCH${currentYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    }
}

/* ============================================================
   PASSWORD GENERATOR
   ============================================================ */
function setupPasswordGenerator() {
    const generateBtn = document.getElementById('generatePasswordBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        const password = generateSecurePassword();
        const passwordInput = document.getElementById('teacherPassword');
        if (passwordInput) {
            passwordInput.value = password;
        }

        await generateTeacherCode();
    });
}

async function generateTeacherCode() {
    const teacherCodeInput = document.getElementById('teacherCode');
    if (!teacherCodeInput) return;

    const currentYear = new Date().getFullYear();
    const prefix = `TCH${currentYear}-`;

    try {
        const { data: existingCodes, error } = await window.supabaseClient
            .from('profiles')
            .select('teacher_code')
            .eq('role', 'teacher')
            .not('teacher_code', 'is', null);

        const usedCodes = new Set();
        if (!error && existingCodes) {
            existingCodes.forEach(item => {
                if (item.teacher_code) {
                    usedCodes.add(item.teacher_code.trim());
                }
            });
        }

        let code;
        let attempts = 0;
        do {
            const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            code = `${prefix}${suffix}`;
            attempts += 1;
        } while (usedCodes.has(code) && attempts < 20);

        teacherCodeInput.value = code;
    } catch (err) {
        console.error("Failed to generate teacher code:", err);
        teacherCodeInput.value = `TCH${currentYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    }
}

function generateSecurePassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Ensure at least one of each required type
    const requiredChars = [
        uppercase[Math.floor(Math.random() * uppercase.length)],
        lowercase[Math.floor(Math.random() * lowercase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        special[Math.floor(Math.random() * special.length)]
    ];

    // Fill remaining to meet 12-16 length
    const allChars = uppercase + lowercase + numbers + special;
    const remainingLength = Math.floor(Math.random() * 5) + 8; // 8-12 additional chars
    const randomChars = [];
    for (let i = 0; i < remainingLength; i++) {
        randomChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Combine and shuffle
    const combined = [...requiredChars, ...randomChars];
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
}

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
    const createAccountBtn = document.getElementById('createTeacherAccountBtn');
    if (!createAccountBtn) return;

    createAccountBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Gather all form fields
        const firstName = document.getElementById('teacherFirstName')?.value.trim();
        const lastName = document.getElementById('teacherLastName')?.value.trim();
        const email = document.getElementById('teacherEmail')?.value.trim();
        const school = document.getElementById('teacherSchool')?.value;
        const gradeLevel = document.getElementById('teacherGradeLevel')?.value;
        const password = document.getElementById('teacherPassword')?.value.trim();
        const teacherCode = document.getElementById('teacherCode')?.value.trim();

        // Validate required fields
        if (!firstName || !lastName || !email || !school || !gradeLevel || !password) {
            alert("Please fill in all required fields marked with *.");
            return;
        }

        // Validate email format
        if (!email.includes('@') || !email.includes('.')) {
            alert("Please enter a valid email address.");
            return;
        }

        // Validate password requirements
        const passwordErrors = [];
        if (password.length < 8) passwordErrors.push("At least 8 characters");
        if (!/[A-Z]/.test(password)) passwordErrors.push("Contains uppercase letter");
        if (!/[a-z]/.test(password)) passwordErrors.push("Contains lowercase letter");
        if (!/[0-9]/.test(password)) passwordErrors.push("Contains at least one number");
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) passwordErrors.push("Contains at least one special character");

        if (passwordErrors.length > 0) {
            alert("Password requirements not met:\n• " + passwordErrors.join("\n• "));
            return;
        }

        createAccountBtn.innerText = "⏳ Creating Account...";
        createAccountBtn.disabled = true;

        try {
            // 1. SAVE THE ADMIN'S SESSION SO WE DON'T LOSE IT
            const { data: { session: currentAdminSession } } = await window.supabaseClient.auth.getSession();

            // 2. Create the user via Supabase Auth
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: 'teacher',
                        school: school,
                        grade_level: gradeLevel,
                        teacher_code: teacherCode,
                        department: `${school} - ${gradeLevel}`
                    }
                }
            });

            if (authError) {
                alert("Failed to create teacher account: " + authError.message);
                createAccountBtn.innerText = "✅ Create Account";
                createAccountBtn.disabled = false;
                return;
            }

            // 3. RESTORE THE ADMIN'S SESSION IMMEDIATELY
            if (currentAdminSession) {
                await window.supabaseClient.auth.setSession({
                    access_token: currentAdminSession.access_token,
                    refresh_token: currentAdminSession.refresh_token
                });
            }

            // 4. Store teacher_code in profiles table if it doesn't have it
            if (authData?.user?.id) {
                const { error: updateError } = await window.supabaseClient
                    .from('profiles')
                    .update({ 
                        teacher_code: teacherCode,
                        school: school,
                        grade_level: gradeLevel,
                        first_name: firstName,
                        last_name: lastName,
                        department: `${school} - ${gradeLevel}`
                    })
                    .eq('id', authData.user.id);

                if (updateError) {
                    console.warn("Failed to update profile metadata:", updateError.message);
                }
            }

            alert(`✅ Teacher account created successfully!\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nSchool: ${school}\nGrade Level: ${gradeLevel}\nTeacher Code: ${teacherCode}\nPassword: ${password}`);

            // Clear form fields
            document.getElementById('teacherFirstName').value = '';
            document.getElementById('teacherLastName').value = '';
            document.getElementById('teacherEmail').value = '';
            document.getElementById('teacherSchool').value = '';
            document.getElementById('teacherGradeLevel').value = '';
            document.getElementById('teacherPassword').value = '';
            // Keep teacher code generated for the next user

            createAccountBtn.innerText = "✅ Create Account";
            createAccountBtn.disabled = false;
            document.getElementById('teacherDrawer').classList.remove('active');

            // 5. Reload full directory under Admin session
            await loadFacultyDirectory();

        } catch (err) {
            console.error("Failed to create teacher account:", err);
            alert("An unexpected error occurred. Please try again.");
            createAccountBtn.innerText = "✅ Create Account";
            createAccountBtn.disabled = false;
        }
    });
}

function manageUser(userId) {
    alert("User Management for ID: " + userId + "\nThis action opens detail configurations.");
}

document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard Check
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('admin');
    }

    // Modal DOM Elements
    const editModal = document.getElementById('editProfileModal');
    const closeBtn = document.getElementById('closeEditProfileModal');
    const cancelBtn = document.getElementById('cancelEditProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const addTeacherBtn = document.getElementById('openAddTeacherBtn');

    // Function to Populate and Open Edit Modal
    const openEditModal = (btn) => {
        document.getElementById('editTeacherCode').value = btn.getAttribute('data-code');
        document.getElementById('editFirstName').value = btn.getAttribute('data-firstname');
        document.getElementById('editLastName').value = btn.getAttribute('data-lastname');
        document.getElementById('editEmail').value = btn.getAttribute('data-email');
        document.getElementById('editDepartment').value = btn.getAttribute('data-dept');
        document.getElementById('editGradeLevel').value = btn.getAttribute('data-grade');
        document.getElementById('editAncillary').value = btn.getAttribute('data-ancillary') || '';

        editModal.classList.add('active');
    };

    // Function to Close Modal
    const closeModal = () => editModal.classList.remove('active');

    // Attach Event Listeners to all Edit Profile Buttons
    document.querySelectorAll('.btn-edit-profile').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn));
    });

    // Close Modal Events
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) closeModal();
    });

    // Handle Save Profile Action
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Teacher profile information updated successfully! This will reflect in their system profile.');
            closeModal();
        });
    }

    // Redirect to Add Teacher Modal/Drawer on Admin Dashboard
    if (addTeacherBtn) {
        addTeacherBtn.addEventListener('click', () => {
            window.location.href = 'admindashboard.html#teacherDrawer';
        });
    }
});

// Three-Dots Menu Toggle & Removal Logic
    document.addEventListener('click', (e) => {
        const dotsBtn = e.target.closest('.btn-action-dots');
        
        // Close any open dropdown if clicking outside
        document.querySelectorAll('.action-dropdown-wrapper.active').forEach(wrapper => {
            if (!dotsBtn || wrapper !== dotsBtn.closest('.action-dropdown-wrapper')) {
                wrapper.classList.remove('active');
            }
        });

        // Toggle clicked three-dots menu
        if (dotsBtn) {
            const currentWrapper = dotsBtn.closest('.action-dropdown-wrapper');
            currentWrapper.classList.toggle('active');
        }
    });

    // Remove Teacher Handler
    function confirmRemoveTeacher(btn, teacherCode, teacherName) {
        if (confirm(`Are you sure you want to remove ${teacherName} (${teacherCode}) from the directory?`)) {
            const row = btn.closest('tr');
            if (row) {
                row.remove();
            }
            alert(`${teacherName} has been removed successfully.`);
        }
    }