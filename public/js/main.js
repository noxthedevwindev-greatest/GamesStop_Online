const inputs = document.querySelectorAll('.code-input input');

inputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputs[index - 1].focus();
    }
    if (e.key === 'Enter') {
      enterCode();
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      for (let i = 0; i < 6; i++) {
        inputs[i].value = paste[i];
      }
      inputs[5].focus();
    }
  });
});

function enterCode() {
  let code = '';
  inputs.forEach(input => code += input.value);

  const errorMsg = document.getElementById('errorMsg');

  if (code.length !== 6) {
    errorMsg.textContent = 'Please enter all 6 digits';
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    errorMsg.textContent = 'Code must be numbers only';
    return;
  }

  errorMsg.textContent = '';
  window.location.href = `/profile?code=${code}`;
}
