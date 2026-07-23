window.openTeacherEditModal = function(button) {
    const editModal = document.getElementById('editProfileModal');
    if (!editModal || !button) return;

    const modalInputs = {
        firstName: document.getElementById('editFirstName'),
        lastName: document.getElementById('editLastName'),
        email: document.getElementById('editEmail'),
        teacherCode: document.getElementById('editTeacherCode'),
        department: document.getElementById('editDepartment'),
        gradeLevel: document.getElementById('editGradeLevel'),
        ancillary: document.getElementById('editAncillary')
    };

    const data = button.dataset || {};
    if (modalInputs.firstName) modalInputs.firstName.value = data.firstname || '';
    if (modalInputs.lastName) modalInputs.lastName.value = data.lastname || '';
    if (modalInputs.email) modalInputs.email.value = data.email || '';
    if (modalInputs.teacherCode) modalInputs.teacherCode.value = data.code || '';
    if (modalInputs.department) modalInputs.department.value = data.dept || '';
    if (modalInputs.gradeLevel) modalInputs.gradeLevel.value = data.grade || '';
    if (modalInputs.ancillary) modalInputs.ancillary.value = data.ancillary || '';

    editModal.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('editProfileModal');
    const closeEditModalBtn = document.getElementById('closeEditProfileModal');
    const cancelEditModalBtn = document.getElementById('cancelEditProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    const modalInputs = {
        firstName: document.getElementById('editFirstName'),
        lastName: document.getElementById('editLastName'),
        email: document.getElementById('editEmail'),
        teacherCode: document.getElementById('editTeacherCode'),
        department: document.getElementById('editDepartment'),
        gradeLevel: document.getElementById('editGradeLevel'),
        ancillary: document.getElementById('editAncillary')
    };

    if (!editModal || !saveProfileBtn) return;

    const closeModal = () => {
        editModal.classList.remove('active');
    };

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.btn-edit-profile');
        if (button && button.dataset && (button.dataset.firstname || button.dataset.code || button.dataset.dept)) {
            event.preventDefault();
            window.openTeacherEditModal(button);
        }
    });

    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeModal);
    if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeModal);

    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeModal();
    });

    saveProfileBtn.addEventListener('click', async () => {
        const firstName = modalInputs.firstName?.value.trim();
        const lastName = modalInputs.lastName?.value.trim();
        const email = modalInputs.email?.value.trim();
        const teacherCode = modalInputs.teacherCode?.value.trim();
        const department = modalInputs.department?.value.trim();
        const gradeLevel = modalInputs.gradeLevel?.value.trim();
        const ancillary = modalInputs.ancillary?.value.trim();

        if (!firstName || !lastName || !email || !department || !gradeLevel) {
            alert('Please fill in all required fields before saving.');
            return;
        }

        const targetButton = document.querySelector(`.btn-edit-profile[data-code="${teacherCode}"]`);
        const row = targetButton?.closest('tr');

        if (row) {
            const nameCell = row.querySelector('.cell-name strong');
            const emailCell = row.querySelector('.sub-text');
            const deptCell = row.children[2];
            const assignmentCell = row.children[3];

            if (nameCell) nameCell.textContent = `${lastName}, ${firstName}`;
            if (emailCell) emailCell.textContent = email;
            if (deptCell) deptCell.textContent = department;
            if (assignmentCell) assignmentCell.textContent = ancillary || gradeLevel;

            if (targetButton) {
                targetButton.dataset.firstname = firstName;
                targetButton.dataset.lastname = lastName;
                targetButton.dataset.email = email;
                targetButton.dataset.dept = department;
                targetButton.dataset.grade = gradeLevel;
                targetButton.dataset.ancillary = ancillary;
            }
        }

        try {
            if (window.supabaseClient && teacherCode) {
                const { error } = await window.supabaseClient
                    .from('profiles')
                    .update({
                        first_name: firstName,
                        last_name: lastName,
                        department: department,
                        grade_level: gradeLevel
                    })
                    .eq('teacher_code', teacherCode);

                if (error) {
                    console.warn('Profile update warning:', error.message);
                }
            }

            alert('Teacher profile updated successfully.');
            closeModal();
        } catch (err) {
            console.error('Failed to save teacher profile:', err);
            alert('An unexpected error occurred while updating the teacher profile.');
        }
    });
});
