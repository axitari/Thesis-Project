document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherCode = urlParams.get('code');
    if (teacherCode) {
        document.getElementById('reportTeacherCode').textContent = teacherCode;
    }
});