let events = [];
let selectedId = Number(new URLSearchParams(window.location.search).get('id')) || null;

const form = document.getElementById('regForm');
const eventSelect = document.getElementById('selectedEvent');
const summaryCard = document.getElementById('summarycard');
const submitBtn = document.getElementById('submitBtn');

function currentEvent() {
  return events.find(function (e) { return e.id === selectedId; }) || events[0];
}

function renderSummary() {
  const e = currentEvent();
  if (!e) return;

  summaryCard.innerHTML = `
    <div class="eyebrow">Your selection</div>
    <div class="summaryart tone-${e.tone}">
      <div style="position:relative;z-index:1">
        <div class="small" style="color:#dcebdf">${e.cat}</div>
        <h2 style="margin:4px 0;color:#fff">${e.title}</h2>
      </div>
    </div>
    <h3>Event summary</h3>
    <div class="summaryline"><span>Date</span><strong>${dayName(e.date)}, ${fmtDate(e.date)}</strong></div>
    <div class="summaryline"><span>Time</span><strong>${e.time}</strong></div>
    <div class="summaryline"><span>Venue</span><strong style="text-align:right">${e.venue}</strong></div>
    <div class="summaryline"><span>Seats remaining</span><strong>${e.seatsLeft}</strong></div>
    <div class="summarynote">✦ &nbsp; Your registration is complete only after you see the confirmation message.</div>`;
}

function renderEventOptions() {
  eventSelect.innerHTML = events.map(function (e) {
    const selected = e.id === selectedId ? 'selected' : '';
    return `<option value="${e.id}" ${selected}>${e.title} — ${fmtDate(e.date)}</option>`;
  }).join('');
}

async function loadEvents() {
  events = await apiGet('/api/events');
  if (!events.find(function (e) { return e.id === selectedId; })) {
    selectedId = events[0] ? events[0].id : null;
  }
  renderEventOptions();
  renderSummary();
}

function showModal(data, details) {
  document.getElementById('modalMessage').textContent =
    'Thanks, ' + details.fullName + '! Your place for ' + data.event.title + ' is reserved.';
  document.getElementById('regid').textContent = data.registrationId;
  document.getElementById('modalDetails').textContent =
    fmtDate(data.event.date) + ' · ' + data.event.venue + ' · ' + details.course + ' · Roll no. ' + details.roll;
  document.getElementById('modalback').classList.add('open');
}

function closeModal() {
  document.getElementById('modalback').classList.remove('open');
}

eventSelect.addEventListener('change', function () {
  selectedId = Number(eventSelect.value);
  renderSummary();
});

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalback').addEventListener('click', function (ev) {
  if (ev.target.id === 'modalback') closeModal();
});

form.addEventListener('submit', async function (ev) {
  ev.preventDefault();
  if (!form.reportValidity()) return;

  const details = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    course: document.getElementById('course').value,
    roll: document.getElementById('roll').value.trim(),
    eventId: selectedId
  };

  submitBtn.disabled = true;
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Registration failed. Please try again.');
      return;
    }

    showModal(data, details);
    form.reset();
    await loadEvents();
  } catch (err) {
    showToast('Could not reach the server. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});

loadEvents().catch(function () {
  summaryCard.innerHTML = '<div class="empty">Could not load events. Please make sure the server is running.</div>';
});
