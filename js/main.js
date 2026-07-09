// ============================================
// WeCoMMerce - main.js (index.html)
// ============================================

const SUPABASE_URL = 'https://pypylllgiexhirexqiye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_caSn3kfKOjCIWyAMZU2swg_M59ssUeF';

// ---- Toast ----
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ---- Validation ----
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setError(fieldId, errorId, show) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  if (show) {
    field.classList.add('error');
    err.classList.add('show');
  } else {
    field.classList.remove('error');
    err.classList.remove('show');
  }
}

// ---- Submit ----
async function handleSubmit() {
  const name  = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  let valid = true;

  if (!name || name.length < 2) {
    setError('name', 'name-error', true);
    valid = false;
  } else {
    setError('name', 'name-error', false);
  }

  if (!email || !validateEmail(email)) {
    setError('email', 'email-error', true);
    valid = false;
  } else {
    setError('email', 'email-error', false);
  }

  if (!valid) return;

  const btn = document.getElementById('submit-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // Check if email already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&select=id,funnel_stage`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const existing = await checkRes.json();

    let leadId;

    if (existing && existing.length > 0) {
      // Email exists — update name and reset stage
      leadId = existing[0].id;
      await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ name, funnel_stage: 'landing' })
      });
    } else {
      // New lead
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ name, email, funnel_stage: 'landing' })
      });
      const inserted = await insertRes.json();
      leadId = inserted[0].id;
    }

    // Save locally
    localStorage.setItem('wc_lead', JSON.stringify({ id: leadId, name, email }));

    showToast('تم التسجيل بنجاح! ', 'success');

    setTimeout(() => {
      window.location.href = '/video/';
    }, 800);

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ---- Enter key support ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSubmit();
});
