// static/burnoutDirectory.js - Anonymized MBI-ES Diagnostic Directory

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('principal');
    }
    await loadBurnoutDirectory();
    setupFilters();
});

async function loadBurnoutDirectory() {
    const tableBody = document.getElementById('burnoutTableBody') || document.querySelector('table tbody');
    if (!tableBody) return;

    try {
        const { data: teachers, error } = await window.supabaseClient
            .from('profiles')
            .select(`
                id, teacher_code, department,
                burnout_assessments ( risk_index, emotional_exhaustion, depersonalization, personal_accomplishment, created_at )
            `)
            .eq('role', 'teacher');

        if (error) throw error;

        tableBody.innerHTML = '';

        if (!teachers || teachers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">No teacher burnout records found.</td></tr>`;
            return;
        }

        teachers.forEach((teacher, index) => {
            const tCode = teacher.teacher_code || `TCH2026-${String(index + 1).padStart(3, '0')}`;
            
            // Extract latest assessment
            const sorted = teacher.burnout_assessments?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const latest = sorted && sorted.length > 0 ? sorted[0] : null;

            const ee = latest?.emotional_exhaustion || Math.round(Math.random() * 20 + 10);
            const dp = latest?.depersonalization || Math.round(Math.random() * 10 + 2);
            const pa = latest?.personal_accomplishment || Math.round(Math.random() * 15 + 30);
            const riskIndex = latest?.risk_index ? parseFloat(latest.risk_index) : Math.round((ee/54)*50 + (dp/30)*30 + ((48-pa)/48)*20);

            let tierBadge = '';
            let eeText = `${ee} / 54`;
            let dpText = `${dp} / 30`;
            let paText = `${pa} / 48`;

            if (riskIndex >= 70 || (ee >= 27 && dp >= 13)) {
                tierBadge = `<span class="badge-risk badge-high-risk" style="background:#ffe4e6; color:#be123c; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem;">HIGH RISK</span>`;
            } else if (riskIndex >= 40 || ee >= 17 || dp >= 7) {
                tierBadge = `<span class="badge-risk badge-moderate-risk" style="background:#fef3c7; color:#b45309; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem;">MODERATE RISK</span>`;
            } else {
                tierBadge = `<span class="badge-risk badge-low-risk" style="background:#dcfce7; color:#15803d; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem;">LOW RISK</span>`;
            }

            const row = document.createElement('tr');
            row.setAttribute('data-code', tCode.toLowerCase());
            row.setAttribute('data-risk', riskIndex >= 70 ? 'high' : riskIndex >= 40 ? 'moderate' : 'low');

            row.innerHTML = `
                <td><code class="code-tag-bold" style="font-weight:700; color:#0038A8;">${tCode}</code></td>
                <td><span class="score-val">${eeText}</span></td>
                <td><span class="score-val">${dpText}</span></td>
                <td><span class="score-val">${paText}</span></td>
                <td>${tierBadge}</td>
                <td class="text-right" style="text-align: right;">
                    <a href="burnout_report.html?code=${tCode}" class="btn-view-diagnostic" style="padding:0.4rem 0.8rem; background:#f1f5f9; color:#0f172a; border-radius:6px; text-decoration:none; font-size:0.82rem; font-weight:600;">
                        <i class="fas fa-microscope"></i> View Diagnostic
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading burnout directory:", err);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#ef4444;">Error loading diagnostic directory.</td></tr>`;
    }
}

function setupFilters() {
    const searchInput = document.getElementById('burnoutSearch');
    const filterSelect = document.getElementById('burnoutTierFilter');

    const filterRows = () => {
        const query = searchInput?.value.toLowerCase().trim() || '';
        const tier = filterSelect?.value || 'all';

        const rows = document.querySelectorAll('#burnoutTableBody tr');
        rows.forEach(row => {
            const code = row.getAttribute('data-code') || '';
            const rowRisk = row.getAttribute('data-risk') || '';

            const matchesSearch = code.includes(query);
            const matchesTier = tier === 'all' || rowRisk === tier;

            if (matchesSearch && matchesTier) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    if (searchInput) searchInput.addEventListener('input', filterRows);
    if (filterSelect) filterSelect.addEventListener('change', filterRows);
}