document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard Verification for Teacher Role
    if (typeof checkAuthAndRole === 'function') {
        checkAuthAndRole('teacher');
    }

    const mbiForm = document.getElementById('mbiForm');
    const resultBox = document.getElementById('result');

    if (mbiForm) {
        mbiForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const totalQuestions = 22;
            const answeredCount = mbiForm.querySelectorAll('input[type="radio"]:checked').length;

            if (answeredCount < totalQuestions) {
                resultBox.style.display = 'block';
                resultBox.style.background = '#fef2f2';
                resultBox.style.color = '#b91c1c';
                resultBox.style.borderColor = '#fecaca';
                resultBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please complete all 22 items before submitting your assessment.';
                return;
            }

            // Calculate Subscale Scores
            let eeScore = 0; // Items 1-9
            let dpScore = 0; // Items 10-14
            let paScore = 0; // Items 15-22

            const formData = new FormData(mbiForm);

            for (let i = 1; i <= 9; i++) eeScore += parseInt(formData.get(`q${i}`) || 0, 10);
            for (let i = 10; i <= 14; i++) dpScore += parseInt(formData.get(`q${i}`) || 0, 10);
            for (let i = 15; i <= 22; i++) paScore += parseInt(formData.get(`q${i}`) || 0, 10);

            resultBox.style.display = 'block';
            resultBox.style.background = '#f0fdf4';
            resultBox.style.color = '#15803d';
            resultBox.style.borderColor = '#bbf7d0';
            resultBox.innerHTML = `
                <div style="font-size: 1.05rem; margin-bottom: 0.4rem;">
                    <i class="fas fa-check-circle"></i> Assessment Submitted Successfully!
                </div>
                <div style="font-size: 0.875rem; color: #166534; font-weight: normal;">
                    <strong>Emotional Exhaustion:</strong> ${eeScore} &bull; 
                    <strong>Depersonalization:</strong> ${dpScore} &bull; 
                    <strong>Personal Accomplishment:</strong> ${paScore}
                </div>
            `;

            // Scroll down to view the completion message
            resultBox.scrollIntoView({ behavior: 'smooth' });
        });
    }
});