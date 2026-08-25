// static/teacherAssessment.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard Verification
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('teacher');
    }

    const form = document.getElementById('mbiForm');
    if (form) {
        form.addEventListener('submit', handleAssessmentSubmit);
    }
});

async function handleAssessmentSubmit(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.btn-submit');
    const resultDiv = document.getElementById('result');

    const formData = new FormData(event.target);

    // MBI-ES Subscale Sums
    let eeScore = 0; // Q1 to Q9 (Max 54)
    let dpScore = 0; // Q10 to Q14 (Max 30)
    let paScore = 0; // Q15 to Q22 (Max 48)

    for (let i = 1; i <= 9; i++) {
        eeScore += parseInt(formData.get(`q${i}`) || 0, 10);
    }
    for (let i = 10; i <= 14; i++) {
        dpScore += parseInt(formData.get(`q${i}`) || 0, 10);
    }
    for (let i = 15; i <= 22; i++) {
        paScore += parseInt(formData.get(`q${i}`) || 0, 10);
    }

    // Standardized Formula Calculation (Weighted composite)
    const eeNorm = eeScore / 54;
    const dpNorm = dpScore / 30;
    const paInverseNorm = 1 - (paScore / 48);

    const rawRiskIndex = (0.50 * eeNorm + 0.30 * dpNorm + 0.20 * paInverseNorm) * 100;
    const riskIndex = parseFloat(rawRiskIndex.toFixed(2)); // Rounded to 2 decimal places for DECIMAL(5,2)

    if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;
        submitBtn.disabled = true;
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            alert("Session expired. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        // Insert into Supabase
        const { error } = await window.supabaseClient
            .from('burnout_assessments')
            .insert({
                teacher_id: session.user.id,
                ee_score: eeScore,
                dp_score: dpScore,
                pa_score: paScore,
                risk_index: riskIndex
            });

        if (error) throw error;

        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <strong style="color: #166534; font-size: 1.1rem;"><i class="fas fa-check-circle"></i> Assessment Recorded!</strong>
                    <p style="margin-top: 0.5rem; color: #15803d;">
                        Calculated Risk Index: <strong>${riskIndex}/100</strong> (EE: ${eeScore}/54 | DP: ${dpScore}/30 | PA: ${paScore}/48)
                    </p>
                </div>
            `;
        }

        alert(`Assessment submitted successfully! Calculated Risk Score: ${riskIndex}`);
        
        // Redirect to Analytics Page
        setTimeout(() => {
            window.location.href = 'teacher_analytics.html';
        }, 1200);

    } catch (err) {
        console.error("Failed to record assessment:", err);
        alert("Submission failed: " + (err.message || err));
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Submit Survey`;
            submitBtn.disabled = false;
        }
    }
}