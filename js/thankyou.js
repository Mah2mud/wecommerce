// ============================================
// WeCoMMerce - thankyou.js
// ============================================

const lead    = JSON.parse(localStorage.getItem('wc_lead')    || 'null');
const booking = JSON.parse(localStorage.getItem('wc_booking') || 'null');

if (!lead || !booking) {
  window.location.href = 'index.html';
}

// Fill details
document.getElementById('ty-title').textContent = 'شكراً لك ' + lead.name + '!';
document.getElementById('ty-name').textContent  = lead.name;
document.getElementById('ty-email').textContent = lead.email;
document.getElementById('ty-date').textContent  = booking.dateLabel;
document.getElementById('ty-time').textContent  = booking.timeLabel;

// Go home — clear booking data but keep nothing
function goHome() {
  localStorage.removeItem('wc_booking');
  localStorage.removeItem('wc_lead');
  window.location.href = 'index.html';
}
