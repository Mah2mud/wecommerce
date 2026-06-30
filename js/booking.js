// ============================================
// WeCoMMerce - booking.js
// ============================================

const SUPABASE_URL = 'https://pypylllgiexhirexqiye.supabase.co';
const SUPABASE_KEY = 'sb_publishable_caSn3kfKOjCIWyAMZU2swg_M59ssUeF';

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const ARABIC_DAYS   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

// State
let viewYear, viewMonth;
let selectedDate = null;   // 'YYYY-MM-DD'
let selectedDateLabel = '';
let selectedTime = null;   // '17:00'
let selectedTimeLabel = '';
let existingBookingId = null;
let bookedSlots = {};      // { 'YYYY-MM-DD': ['17:00', '18:00'] }

// Guard
const lead = JSON.parse(localStorage.getItem('wc_lead') || 'null');
if (!lead) window.location.href = '/';

// ---- Toast ----
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ---- Init calendar to current month ----
function initCalendar() {
  const now = new Date();
  viewYear  = now.getFullYear();
  viewMonth = now.getMonth();
  renderCalendar();
}

// ---- Render calendar ----
async function renderCalendar() {
  const title = document.getElementById('calendar-title');
  title.textContent = ARABIC_MONTHS[viewMonth] + ' ' + viewYear;

  const today   = new Date();
  today.setHours(0,0,0,0);
  // اليوم + 7 أيام تقويمية (الأحد مغلق بشكل منفصل لكن يُحسب ضمن النطاق)
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  // First day of the month (0=Sun)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Fetch bookings for this month from Supabase
  const monthStr  = String(viewMonth + 1).padStart(2,'0');
  const dateFrom  = `${viewYear}-${monthStr}-01`;
  const dateTo    = `${viewYear}-${monthStr}-${String(daysInMonth).padStart(2,'0')}`;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?booking_date=gte.${dateFrom}&booking_date=lte.${dateTo}&select=booking_date,booking_time,status`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const rows = await res.json();
    bookedSlots = {};
    rows.forEach(r => {
      if (!bookedSlots[r.booking_date]) bookedSlots[r.booking_date] = [];
      bookedSlots[r.booking_date].push(r.booking_time);
    });
  } catch (e) {
    console.error('Fetch bookings error:', e);
  }

  const container = document.getElementById('calendar-days');
  container.innerHTML = '';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    container.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.textContent = d;
    cell.className = 'cal-day';

    const thisDate = new Date(viewYear, viewMonth, d);
    thisDate.setHours(0,0,0,0);
    const dateStr = `${viewYear}-${monthStr}-${String(d).padStart(2,'0')}`;

    const isSunday  = thisDate.getDay() === 0;
    const isPast    = thisDate < today;
    const isFuture  = thisDate > maxDate;
    const isToday   = thisDate.getTime() === today.getTime();
    const allBooked = bookedSlots[dateStr] && bookedSlots[dateStr].length >= 4;

    if (isToday) cell.classList.add('today');

    if (isSunday || isPast || isFuture || allBooked) {
      cell.classList.add('disabled');
      if (isSunday) cell.classList.add('sunday');
    } else {
      if (bookedSlots[dateStr] && bookedSlots[dateStr].length > 0) {
        cell.classList.add('booked-indicator');
      }
      if (selectedDate === dateStr) cell.classList.add('selected');
      cell.onclick = () => selectDay(dateStr, d, thisDate);
    }

    container.appendChild(cell);
  }

  // Nav buttons
  const now2     = new Date();
  const prevBtn  = document.getElementById('prev-month-btn');
  const nextBtn  = document.getElementById('next-month-btn');
  // حساب الشهر الأقصى بناءً على نافذة 7 أيام
  const maxNav   = new Date(now2);
  maxNav.setDate(now2.getDate() + 7);
  const maxNavM  = maxNav.getMonth();
  const maxNavY  = maxNav.getFullYear();
  // زر السابق: معطّل لو كنا في الشهر الحالي
  prevBtn.disabled = (viewYear === now2.getFullYear() && viewMonth <= now2.getMonth());
  // زر التالي: معطّل لو تجاوزنا الشهر الأقصى
  nextBtn.disabled = (viewYear > maxNavY) || (viewYear === maxNavY && viewMonth >= maxNavM);
  prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
  nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
}

// ---- Change month ----
function changeMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0;  viewYear++; }
  selectedDate = null;
  selectedTime = null;
  document.getElementById('time-section').classList.remove('show');
  document.getElementById('booking-summary').classList.remove('show');
  renderCalendar();
}

// ---- Select day ----
async function selectDay(dateStr, dayNum, dateObj) {
  selectedDate = dateStr;
  selectedDateLabel = ARABIC_DAYS[dateObj.getDay()] + ' ' + dayNum + ' ' + ARABIC_MONTHS[viewMonth] + ' ' + viewYear;
  selectedTime = null;
  selectedTimeLabel = '';

  // Re-render to update selection
  renderCalendar();

  // Show time slots
  const slots = ['17','18','19','20'];
  const booked = bookedSlots[dateStr] || [];
  slots.forEach(h => {
    const el = document.getElementById('slot-' + h);
    el.className = 'time-slot';
    if (booked.includes(h + ':00')) {
      el.classList.add('booked');
      el.querySelector('.time-duration').textContent = 'محجوز';
      el.onclick = null;
    } else {
      el.querySelector('.time-duration').textContent = 'مدة ساعة';
      el.onclick = () => selectTime(h + ':00', getTimeLabel(h));
    }
  });

  document.getElementById('time-section').classList.add('show');
  document.getElementById('booking-summary').classList.remove('show');
  document.getElementById('time-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getTimeLabel(h) {
  const map = { '17': '5:00 م', '18': '6:00 م', '19': '7:00 م', '20': '8:00 م' };
  return map[h];
}

// ---- Select time ----
function selectTime(time, label) {
  selectedTime      = time;
  selectedTimeLabel = label;

  // Update slot UI
  ['17','18','19','20'].forEach(h => {
    const el = document.getElementById('slot-' + h);
    if (!el.classList.contains('booked')) el.classList.remove('selected');
  });
  const h = time.split(':')[0];
  document.getElementById('slot-' + h).classList.add('selected');

  // Show summary
  document.getElementById('sum-name').textContent  = lead.name;
  document.getElementById('sum-date').textContent  = selectedDateLabel;
  document.getElementById('sum-time').textContent  = selectedTimeLabel;
  document.getElementById('booking-summary').classList.add('show');
  document.getElementById('booking-summary').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Confirm booking ----
async function confirmBooking() {
  if (!selectedDate || !selectedTime) {
    showToast('الرجاء اختيار اليوم والوقت', 'error');
    return;
  }

  const btn = document.getElementById('confirm-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // Check if this customer already has a booking
    const existRes = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?customer_email=eq.${encodeURIComponent(lead.email)}&select=id,booking_date,booking_time`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const existing = await existRes.json();

    if (existing && existing.length > 0) {
      existingBookingId = existing[0].id;
      const oldDate = existing[0].booking_date;
      const oldTime = existing[0].booking_time;
      document.getElementById('modal-msg').textContent =
        `لديك موعد محجوز في ${oldDate} الساعة ${oldTime}. هل تريد استبداله بالموعد الجديد: ${selectedDateLabel} الساعة ${selectedTimeLabel}؟`;
      document.getElementById('modal-overlay').classList.add('show');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    await doInsertBooking();

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ---- Replace booking (modal confirm) ----
async function replaceBooking() {
  const mBtn = document.getElementById('modal-confirm-btn');
  mBtn.classList.add('loading');
  mBtn.disabled = true;

  try {
    // Delete old booking
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${existingBookingId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    closeModal();
    await doInsertBooking();

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    mBtn.classList.remove('loading');
    mBtn.disabled = false;
  }
}

// ---- Close modal ----
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  existingBookingId = null;
}

// ---- Insert booking ----
async function doInsertBooking() {
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      lead_id:        lead.id,
      customer_name:  lead.name,
      customer_email: lead.email,
      booking_date:   selectedDate,
      booking_time:   selectedTime,
      status:         'confirmed'
    })
  });

  const inserted = await insertRes.json();

  // Update funnel stage
  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ funnel_stage: 'booking_completed' })
  });

  // Save booking to localStorage
  localStorage.setItem('wc_booking', JSON.stringify({
    date:      selectedDate,
    dateLabel: selectedDateLabel,
    time:      selectedTime,
    timeLabel: selectedTimeLabel
  }));

  showToast('تم تأكيد حجزك! 🎉', 'success');
  setTimeout(() => { window.location.href = '/thankyou/'; }, 900);
}

// ---- Init ----
initCalendar();
