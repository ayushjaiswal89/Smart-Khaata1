// Shared helpers (loaded before script.js)
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const store = {
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def }
  }
};

function validatePhoneNumber(value){
  const digits = String(value||"").replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91')) || (digits.length === 11 && digits.startsWith('0'));
}

function normalizePhone(value){
  return String(value||"").replace(/\D/g, '').slice(-10);
}

function escapeHtml(value){
  return String(value||"")
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setFieldError(input, message){
  if(!input) return;
  input.classList.add('input-error');
  input.setAttribute('aria-invalid','true');
  const existing = input.parentElement.querySelector('.error-text');
  if(existing) existing.remove();
  if(message){
    const note = document.createElement('div');
    note.className = 'helper-text error-text';
    note.textContent = message;
    input.parentElement.appendChild(note);
  }
}

function clearFieldError(input){
  if(!input) return;
  input.classList.remove('input-error');
  input.removeAttribute('aria-invalid');
  const existing = input.parentElement.querySelector('.error-text');
  if(existing) existing.remove();
}
