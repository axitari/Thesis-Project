// static/workloadCategoryList.js

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryTable();
});

async function loadCategoryTable() {
    // Broad selector to catch tables across the different HTML files
    const tableBody = document.querySelector('table tbody');
    if (!tableBody) {
        console.warn("[workloadCategoryList] No <tbody> found on this page.");
        return;
    }

    // Determine target category from the URL
    const path = window.location.pathname.toLowerCase();
    let targetCategories = [];
    
    if (path.includes('underload')) targetCategories = ['UNDERLOAD'];
    else if (path.includes('optimal')) targetCategories = ['OPTIMAL'];
    else if (path.includes('high') || path.includes('maximized')) targetCategories = ['HIGH', 'MAXIMIZED'];
    else if (path.includes('overload')) targetCategories = ['OVERLOAD'];
    else targetCategories = ['OPTIMAL']; // Fallback default

    try {
        // 💡 Changed ancillary_duties to (*) so Supabase fetches all existing columns without error
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select(`
                id, first_name, last_name, role, department, teacher_code,
                teaching_loads ( minutes_per_week ),
                ancillary_duties ( * )
            `)
            .eq('role', 'teacher');

        if (error) throw error;

        // Purge the static HTML placeholder rows
        tableBody.innerHTML = '';

        // Safe WLU Fallback Calculator (In case window.calculateWLUDetails isn't initialized yet)
        const getWLU = (profile) => {
            if (typeof window.calculateWLUDetails === 'function') {
                return window.calculateWLUDetails(profile);
            }
            // Baseline Fallback Engine
            const teachingMins = profile.teaching_loads?.reduce((sum, item) => sum + (item.minutes_per_week || 0), 0) || 0;
            const teachingHrs = teachingMins / 60;
            const teachingWLU = teachingHrs * 1.0;

            let ancillaryWLU = 0;
            let ancillaryHrs = 0;
            profile.ancillary_duties?.forEach(duty => {
                const hrs = parseFloat(duty.hours_per_week || duty.hours || 0);
                const name = (duty.duty_name || duty.duty_title || duty.name || duty.title || '').toLowerCase();
                if (name.includes('coordinator') || name.includes('chair') || name.includes('paper') || name.includes('sdrrm')) {
                    ancillaryWLU += hrs * 2.0;
                } else {
                    ancillaryWLU += hrs * 1.5;
                }
                ancillaryHrs += hrs;
            });

            const totalJDS = parseFloat((teachingWLU + ancillaryWLU).toFixed(2));
            const totalHours = parseFloat((teachingHrs + ancillaryHrs).toFixed(1));

            let status = 'OPTIMAL';
            if (totalJDS > 75) status = 'OVERLOAD';
            else if (totalJDS >= 66) status = 'MAXIMIZED';
            else if (totalJDS >= 54) status = 'HIGH';
            else if (totalJDS >= 36) status = 'OPTIMAL';
            else status = 'UNDERLOAD';

            return { totalJDS, totalHours, status };
        };

        // Calculate WLU and Filter
        const filteredProfiles = profiles.filter(profile => {
            const wlu = getWLU(profile);
            profile.wlu = wlu; // Save the calculation to the profile object
            return targetCategories.includes(wlu.status);
        });

        if (filteredProfiles.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #64748b;">No faculty members currently fall under this capacity category.</td></tr>`;
            return;
        }

        // Render dynamic rows
        filteredProfiles.forEach((profile, index) => {
            const tCode = profile.teacher_code || `TCH2026-${String(index + 1).padStart(3, '0')}`;
            const fullName = `${profile.last_name || ''}, ${profile.first_name || 'Faculty'}`;
            const dept = profile.department || 'General Education';
            const wlu = profile.wlu;

            let badgeColor = '';
            let actionText = '';
            
            if (wlu.status === 'OVERLOAD') { badgeColor = 'background: #fef2f2; color: #e11d48; border: 1px solid #fecdd3;'; actionText = 'Requires Reallocation'; }
            else if (wlu.status === 'MAXIMIZED' || wlu.status === 'HIGH') { badgeColor = 'background: #fffbeb; color: #d97706; border: 1px solid #fde68a;'; actionText = 'Monitor Assignment'; }
            else if (wlu.status === 'OPTIMAL') { badgeColor = 'background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;'; actionText = 'Well Balanced'; }
            else { badgeColor = 'background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd;'; actionText = 'Available Capacity'; }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="cell-id"><strong>${tCode}</strong></td>
                <td class="cell-name teacher-name">
                    <strong style="color: #0f172a;">${fullName}</strong>
                    <span class="sub-text" style="display: block; font-size: 0.8rem; color: #64748b;">${dept}</span>
                </td>
                <td>${dept}</td>
                <td>
                    <strong style="color: #0f172a; font-size: 1.05rem;">${wlu.totalJDS} WLU</strong>
                    <br><span style="font-size: 0.75rem; color: #64748b;">(${wlu.totalHours} raw hrs)</span>
                </td>
                <td><span style="font-size: 0.85rem; font-weight: 600; color: #475569;">${actionText}</span></td>
                <td><span style="padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; display: inline-block; ${badgeColor}">${wlu.status}</span></td>
                <td style="text-align: right;">
                    <button class="action-btn btn-outline" style="padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer;" onclick="alert('Viewing workload detail for ${fullName}')">
                        <i class="fas fa-eye"></i> Manage
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading category list:", err);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading live roster data.</td></tr>`;
    }
}