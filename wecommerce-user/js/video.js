// ============================================
// WeCoMMerce - video.js
// ============================================

const SUPABASE_URL = 'https://pypylllgiexhirexqiye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_caSn3kfKOjCIWyAMZU2swg_M59ssUeF';

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// Check lead exists
const lead = JSON.parse(localStorage.getItem('wc_lead') || 'null');
if (!lead) {
  window.location.href = '/';
}

// Register video view in Supabase
async function registerVideoView() {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ funnel_stage: 'video_viewed' })
    });
  } catch (e) {
    console.error('Video view register error:', e);
  }
}

// Run on page load
registerVideoView();

async function skipVideo() {
  const btn = document.getElementById('skip-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ funnel_stage: 'video_viewed' })
    });
    window.location.href = '/survey/';
  } catch (e) {
    showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}
