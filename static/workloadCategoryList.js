// static/workloadCategoryList.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (Admins and Principals allowed)
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('any');
    }

    await loadCategoryTable();
});

async function loadCategoryTable() {
    const tableBody = document.querySelector('.reallocation-table tbody, .admin-table tbody');
    if (!tableBody) return;

    // Determine target category based on page URL or main tag class
    const path = window.location.pathname;
    let targetCategory = 'all';

    if (path.includes('underloaded')) targetCategory = 'underload';
    else if (path.includes('optimal')) targetCategory = 'optimal';
    else if (path.includes('high-load')) targetCategory = 'maximized';
    else if (path.includes('overloaded')) targetCategory = 'overload';

    try {
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select(`
                id,
                first_name,
                last_name,
                role,
                department,
                teacher_code,
                teaching_loads ( minutes_per_week ),
                ancillary_duties ( hours_per_week )
            `)
            .eq('role', 'teacher');

        if (error) throw error;

        tableBody.innerHTML = '';

        const filteredProfiles = profiles.filter(profile => {
            const teachingMins = profile.teaching_loads?.reduce((sum, i) => sum + (i.minutes_per_week || 0), 0) || 0;
            const teachingHrs = teachingMins / 60;
            const ancillaryHrs = profile.ancillary_duties?.reduce((sum, i) => sum + parseFloat(i.hours_per_week || 0), 0) || 0;
            const totalHrs = teachingHrs + ancillaryHrs;

            if (targetCategory === 'overload') return totalHrs > 30;
            if (targetCategory === 'maximized') return totalHrs > 28 && totalHrs <= 30;
            if (targetCategory === 'optimal') return totalHrs >= 24 && totalHrs <= 28;
            if (targetCategory === 'underload') return totalHrs < 24;
            return true;
        });

        if (filteredProfiles.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No faculty members currently fall under this capacity category.</td></tr>`;
            return;
        }

        filteredProfiles.forEach((profile, index) => {
            const teachingMins = profile.teaching_loads?.reduce((sum, i) => sum + (i.minutes_per_week || 0), 0) || 0;
            const teachingHrs = teachingMins / 60;
            const ancillaryHrs = profile.ancillary_duties?.reduce((sum, i) => sum + parseFloat(i.hours_per_week || 0), 0) || 0;
            const totalWorkloadHrs = (teachingHrs + ancillaryHrs).toFixed(1);

            const tCode = profile.teacher_code || `TCH2026-${String(index + 1).padStart(3, '0')}`;
            const fullName = `${profile.last_name || ''}, ${profile.first_name || 'Faculty'}`;
            const dept = profile.department || 'General Education';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="cell-id">${tCode}</td>
                <td class="cell-name teacher-name">
                    <strong>${fullName}</strong>
                    <span class="sub-text">${dept}</span>
                </td>
                <td>${dept}</td>
                <td><strong class="load-value">${totalWorkloadHrs} hrs</strong></td>
                <td>
                    <span class="reco-pill">
                        ${totalWorkloadHrs < 24 ? 'Available for Ancillary Allocation' : totalWorkloadHrs > 30 ? 'Requires Immediate Duty Reallocation' : 'Capacity Balanced'}
                    </span>
                </td>
                <td><span class="table-badge">${targetCategory.toUpperCase()}</span></td>
                <td>
                    <button class="action-btn open-reco-modal" onclick="alert('Viewing workload detail for ${fullName}')">
                        <i class="fas fa-eye"></i> Manage
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading category list:", err);
    }
}