// static/registerLogic.js

function renderRegisteredSchoolOptions() {
    const schoolSelect = document.getElementById('school');
    const stored = localStorage.getItem('kandili_master_schools');
    if (!schoolSelect || stored === null) return;

    let schools;
    try {
        schools = JSON.parse(stored);
    } catch (error) {
        console.error('Unable to read the registered school list:', error);
        return;
    }

    if (!Array.isArray(schools)) {
        console.error('The registered school list must be a JSON array.');
        return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Select School...';
    schoolSelect.replaceChildren(placeholder);

    schools.forEach(school => {
        if (typeof school.school_name !== 'string' || !school.school_name.trim()) return;
        const option = document.createElement('option');
        option.value = school.school_name;
        option.textContent = school.short_code
            ? `${school.school_name} (${school.short_code})`
            : school.school_name;
        schoolSelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderRegisteredSchoolOptions();
    window.addEventListener('storage', event => {
        if (event.key === 'kandili_master_schools') renderRegisteredSchoolOptions();
    });
    window.addEventListener('kandili:schools-updated', renderRegisteredSchoolOptions);
});

const registerForm = document.getElementById('registerForm');

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const depedEmployeeId = document.getElementById('depedEmployeeId')?.value || '';
    const plantillaItemNo = document.getElementById('plantillaItemNo')?.value || '';
    const prcLicenseNo = document.getElementById('prcLicenseNo')?.value || '';
    const employmentStatus = document.getElementById('employmentStatus')?.value || '';
    const yearsInService = document.getElementById('yearsInService')?.value || '';
    const division = document.getElementById('division')?.value || '';
    const school = document.getElementById('school')?.value || '';
    const assignedInstitution = document.getElementById('assignedInstitution')?.value || school || '';
    const department = document.getElementById('department')?.value || '';
    const advisoryClass = document.getElementById('advisoryClass')?.value || '';
    const educationalAttainment = document.getElementById('educationalAttainment')?.value || '';
    const contactNumber = document.getElementById('contactNumber')?.value || '';
    const teachingLevel = document.getElementById('teachingLevel')?.value || '';

    // Maps the frontend HTML value attributes to the database ENUM values
    const formRoleToEnum = {
        'Teacher': 'teacher',
        'Master Teacher': 'teacher',
        'Principal': 'principal'
    };
    const normalizedRole = formRoleToEnum[role];

    if (!normalizedRole) {
        console.error(`No enum mapping for role "${role}" — check register.html dropdown values.`);
        alert('Something went wrong with the selected role. Please contact an administrator.');
        return;
    }

    // Pass all profile data as secure registration metadata to the Auth signup
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                role: normalizedRole,
                deped_employee_id: depedEmployeeId,
                plantilla_item_no: plantillaItemNo,
                prc_license_no: prcLicenseNo,
                employment_status: employmentStatus,
                years_in_service: yearsInService ? Number(yearsInService) : null,
                division: division,
                assigned_institution: assignedInstitution,
                department: department,
                advisory_class: advisoryClass,
                educational_attainment: educationalAttainment,
                contact_number: contactNumber,
                grade_level: teachingLevel,
                school: school
            }
        }
    });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Registration Error: " + error.message);
        return;
    }

    console.log("Registration successful! Backend trigger handling profile creation.", data);
    alert("Success! Account successfully created. You may now log in.");

    window.location.href = "login.html";
});