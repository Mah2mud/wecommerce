// ============================================
// WeCoMMerce - survey.js
// ============================================

const SUPABASE_URL = 'https://pypylllgiexhirexqiye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_caSn3kfKOjCIWyAMZU2swg_M59ssUeF';

let currentStep = 1;

// Guard: must have lead
const lead = JSON.parse(localStorage.getItem('wc_lead') || 'null');
if (!lead) window.location.href = '/';

// ---- Toast ----
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ---- Checkbox toggle ----
function toggleCheckbox(el) {
  el.closest('.checkbox-item').classList.toggle('checked', el.checked);
}

// ---- Get selected challenges ----
function getChallenges() {
  return Array.from(
    document.querySelectorAll('#challenges-group input[type="checkbox"]:checked')
  ).map(cb => cb.value);
}

// ---- Error helper ----
function setError(id, errorId, show) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errorId);
  if (!el || !err) return;
  if (show) {
    el.classList.add('error');
    err.classList.add('show');
  } else {
    el.classList.remove('error');
    err.classList.remove('show');
  }
}

// ---- Update progress bar ----
function updateProgress(step) {
  const fill = document.getElementById('survey-progress-fill');
  fill.style.width = (step / 3 * 100) + '%';
}

// ---- Next Step ----
function nextStep(from) {
  if (from === 1) {
    const cat = document.getElementById('store_category').value;
    const exp = document.getElementById('experience').value;
    let ok = true;
    if (!cat) { setError('store_category', 'store_category-error', true); ok = false; }
    else       { setError('store_category', 'store_category-error', false); }
    if (!exp) { setError('experience', 'experience-error', true); ok = false; }
    else      { setError('experience', 'experience-error', false); }
    if (!ok) return;
  }

  if (from === 2) {
    const ms   = document.getElementById('monthly_sales').value;
    const ab   = document.getElementById('ad_budget').value;
    const roas = document.getElementById('roas').value;
    let ok = true;
    if (!ms)   { setError('monthly_sales', 'monthly_sales-error', true); ok = false; }
    else       { setError('monthly_sales', 'monthly_sales-error', false); }
    if (!ab)   { setError('ad_budget', 'ad_budget-error', true); ok = false; }
    else       { setError('ad_budget', 'ad_budget-error', false); }
    if (!roas) { setError('roas', 'roas-error', true); ok = false; }
    else       { setError('roas', 'roas-error', false); }
    if (!ok) return;
  }

  document.getElementById('step-' + from).classList.remove('active');
  currentStep = from + 1;
  document.getElementById('step-' + currentStep).classList.add('active');
  updateProgress(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Prev Step ----
function prevStep(from) {
  document.getElementById('step-' + from).classList.remove('active');
  currentStep = from - 1;
  document.getElementById('step-' + currentStep).classList.add('active');
  updateProgress(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Submit Survey ----
async function submitSurvey() {
  const challenges = getChallenges();
  const main_goal  = document.getElementById('main_goal').value;
  let ok = true;

  if (challenges.length === 0) {
    document.getElementById('challenges-error').classList.add('show');
    ok = false;
  } else {
    document.getElementById('challenges-error').classList.remove('show');
  }

  if (!main_goal) { setError('main_goal', 'main_goal-error', true); ok = false; }
  else            { setError('main_goal', 'main_goal-error', false); }

  if (!ok) return;

  const btn = document.getElementById('submit-survey-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  const data = {
    store_url:        document.getElementById('store_url').value.trim(),
    store_category:   document.getElementById('store_category').value,
    experience:       document.getElementById('experience').value,
    monthly_sales:    document.getElementById('monthly_sales').value,
    ad_budget:        document.getElementById('ad_budget').value,
    roas:             document.getElementById('roas').value,
    challenges:       challenges,
    main_goal:        main_goal,
    additional_notes: document.getElementById('additional_notes').value.trim(),
    funnel_stage:     'survey_completed'
  };

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    showToast('تم حفظ بياناتك! 🎉', 'success');
    setTimeout(() => { window.location.href = '/booking/'; }, 800);

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}
