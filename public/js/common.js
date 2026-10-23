function parseDate(d) {
  return new Date(d + 'T12:00:00');
}

function fmtDate(d) {
  return parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayName(d) {
  return parseDate(d).toLocaleDateString('en-US', { weekday: 'short' });
}

function monthName(d) {
  return parseDate(d).toLocaleDateString('en-US', { month: 'short' });
}

async function apiGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    t.classList.remove('show');
  }, 2800);
}

function eventCard(e) {
  const d = parseDate(e.date);
  const seatsText = e.seatsLeft > 0
    ? '<strong>' + e.seatsLeft + '</strong> seats left'
    : '<strong>Full</strong>';
  return `
    <a class="eventcard" href="event-details.html?id=${e.id}" aria-label="View ${e.title}">
      <div class="eventart tone-${e.tone}">
        <div class="datebadge"><b>${d.getDate()}</b><span>${monthName(e.date)}</span></div>
        <div class="articon">${e.icon}</div>
      </div>
      <div class="eventbody">
        <span class="tag">${e.cat}</span>
        <h3>${e.title}</h3>
        <div class="muted small">${e.tag}</div>
        <div class="eventmeta">
          <span>◷ ${fmtDate(e.date)} · ${e.time.split('–')[0].trim()}</span>
          <span>⌖ ${e.venue.split('·')[0].trim()}</span>
        </div>
        <div class="seats">
          <span>${seatsText}</span>
          <span>View details ↗</span>
        </div>
      </div>
    </a>`;
}

function renderLayout() {
  const active = document.body.dataset.page;

  const header = `
    <div class="topnote">✦ &nbsp; Discover something worth showing up for — your next experience starts here.</div>
    <header class="nav">
      <a class="brand" href="index.html"><div class="brandmark">E</div> EventEase</a>
      <nav class="navlinks" aria-label="Main navigation">
        <a href="index.html" class="${active === 'home' ? 'active' : ''}">Home</a>
        <a href="events.html" class="${active === 'events' ? 'active' : ''}">Events</a>
      </nav>
      <a class="navcta" href="events.html">Explore events ↗</a>
    </header>`;

  const footer = `
    <footer class="foot">
      <div><strong>EventEase</strong> &nbsp; · &nbsp; Make every moment count.</div>
      <div>Discover · Connect · Experience</div>
      <div>© 2026 EventEase</div>
    </footer>`;

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);
}

renderLayout();
