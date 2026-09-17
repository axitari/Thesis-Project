function stepYearUp() {
    const input = document.getElementById('input-years');
    if (input) {
        input.value = (parseInt(input.value, 10) || 0) + 1;
        input.dispatchEvent(new Event('change'));
    }
}

function stepYearDown() {
    const input = document.getElementById('input-years');
    if (input) {
        const current = parseInt(input.value, 10) || 0;
        if (current > 0) {
            input.value = current - 1;
            input.dispatchEvent(new Event('change'));
        }
    }
}