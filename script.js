document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('passwordInput');
  const showBtn = document.getElementById('showBtn');
  const lengthEl = document.getElementById('length');
  const generateBtn = document.getElementById('generateBtn');
  const outputBox = document.querySelector('.output');
  const encryptedSpan = document.getElementById('encryptedPassword');
  const copyBtn = document.getElementById('copyBtn');
  const errorEl = document.getElementById('errorMessage');

  // Accessibility: ensure error element is announced to screen readers
  if (errorEl) errorEl.setAttribute('aria-live', 'polite');

  // --- Configure constants and initial UI ---
  const MAX = 20; // keep maxlength and validation consistent
  if (input) input.setAttribute('maxlength', String(MAX));
  if (outputBox) outputBox.style.display = 'none';
  updateCounter();

  // Create a small toggle for secure hash vs obfuscation 
  const controlsContainer = document.createElement('div');
  controlsContainer.style.margin = '12px 0';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.alignItems = 'center';
  controlsContainer.style.gap = '10px';

  const useHashId = 'useSecureHashToggle';
  const useHashCheckbox = document.createElement('input');
  useHashCheckbox.type = 'checkbox';
  useHashCheckbox.id = useHashId;
  useHashCheckbox.checked = true; // default to secure hashing
  useHashCheckbox.title = 'When checked, produce a secure non-reversible SHA-256 hash';

  const useHashLabel = document.createElement('label');
  useHashLabel.htmlFor = useHashId;
  useHashLabel.textContent = 'Use secure hash (recommended)';

  controlsContainer.appendChild(useHashCheckbox);
  controlsContainer.appendChild(useHashLabel);

  // Insert controls right before the generate button if possible
  if (generateBtn && generateBtn.parentNode) {
    generateBtn.parentNode.insertBefore(controlsContainer, generateBtn);
  } else {
    // fallback: append to container
    document.body.appendChild(controlsContainer);
  }

  // --- Utilities ---
  function updateCounter() {
    if (!input || !lengthEl) return;
    const v = input.value || '';
    lengthEl.textContent = `(${v.length}/${MAX})`;
  }

  input.addEventListener('input', () => {
    updateCounter();
    if (errorEl) errorEl.style.display = 'none';
  });

  // Show / Hide password
  showBtn.addEventListener('click', () => {
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      showBtn.textContent = 'Hide';
    } else {
      input.type = 'password';
      showBtn.textContent = 'Show';
    }
    input.focus();
    const len = input.value.length;
    try { input.setSelectionRange(len, len); } catch (e) { /* non-critical */ }
  });

  // --- Obfuscation (original demo) ---
  function obfuscate(s) {
    try {
      // safe base64 for unicode
      const b = btoa(unescape(encodeURIComponent(s)));
      return b.split('').reverse().join('').slice(0, 20);
    } catch (e) {
      return s.split('').reverse().join('').slice(0, 20);
    }
  }

  // --- Secure SHA-256 hashing (one-way) ---
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert to hex string
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // shorten for display (still deterministic & one-way) — you can remove slice if you want full hash
    return hex.slice(0, 20);
  }

  // Update label that shows the output so it's not misleading
  (function updateOutputLabel() {
    // find the parent p that contains the encryptedPassword span
    if (!encryptedSpan) return;
    const parent = encryptedSpan.parentElement; // the <p> tag
    if (parent) parent.childNodes[0].textContent = 'Output (obfuscated / hashed): ';
  })();

  // --- Generate handler (supports both modes) ---
  generateBtn.addEventListener('click', async () => {
    if (!input) return;
    const val = input.value.trim();
    const len = val.length;

    // Basic validation: length
    if (len < 8 || len > MAX) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<i>⚠</i> Password must be between 8 and ' + MAX + ' characters.';
      } else {
        alert('Password must be between 8 and ' + MAX + ' characters.');
      }
      if (outputBox) outputBox.style.display = 'none';
      return;
    }

    // Hide error, show loading-ish state
    if (errorEl) errorEl.style.display = 'none';
    if (outputBox) outputBox.style.display = 'none';
    if (copyBtn) copyBtn.textContent = 'Copy';

    try {
      const useHash = useHashCheckbox.checked;
      let out;
      if (useHash) {
        out = await hashPassword(val);
      } else {
        out = obfuscate(val);
      }

      if (encryptedSpan) encryptedSpan.textContent = out || '—';
      if (outputBox) outputBox.style.display = 'flex';
    } catch (err) {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<i>⚠</i> Error generating output. ' + (err && err.message ? err.message : '');
      } else {
        console.error(err);
      }
    }
  });

  // --- Copy to clipboard ---
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = encryptedSpan ? (encryptedSpan.textContent || '') : '';
      if (!text) {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.innerHTML = '<i>⚠</i> Nothing to copy.';
          setTimeout(() => (errorEl.style.display = 'none'), 2000);
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1800);
      } catch (err) {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.innerHTML = '<i>⚠</i> Copy failed — copy manually.';
          setTimeout(() => (errorEl.style.display = 'none'), 2500);
        }
      }
    });
  }

  // --- Initial counter call ---
  function updateCounter() {
    if (!input || !lengthEl) return;
    const v = input.value || '';
    lengthEl.textContent = `(${v.length}/${MAX})`;
  }
  updateCounter();
});
