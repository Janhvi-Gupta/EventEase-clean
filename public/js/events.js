let allEvents = [];

const state = {
  search: '',
  category: 'all',
  date: 'all',
  venue: 'all',
  sort: 'soonest'
};

const BASE_DATE = new Date('2026-11-01T12:00:00');
const WEEK_MS = 7 * 86400000;

function shortVenue(venue) {
  return venue.split('·')[0].trim();
}

function filterAndSort() {
  const term = state.search.toLowerCase();

  const list = allEvents.filter(function (e) {
    const text = (e.title + ' ' + e.cat + ' ' + e.venue).toLowerCase();
    const diff = parseDate(e.date) - BASE_DATE;

    const matchesSearch = text.includes(term);
    const matchesCategory = state.category === 'all' || e.cat === state.category;
    const matchesDate =
      state.date === 'all' ||
      (state.date === 'week' && diff < WEEK_MS) ||
      (state.date === 'later' && diff >= WEEK_MS);
    const matchesVenue = state.venue === 'all' || shortVenue(e.venue) === state.venue;

    return matchesSearch && matchesCategory && matchesDate && matchesVenue;
  });

  if (state.sort === 'soonest') {
    list.sort(function (a, b) { return a.date.localeCompare(b.date); });
  } else if (state.sort === 'seats') {
    list.sort(function (a, b) { return a.seatsLeft - b.seatsLeft; });
  }

  return list;
}

function renderResults() {
  const list = filterAndSort();
  const cards = list.length
    ? list.map(eventCard).join('')
    : '<div class="empty">No events match those filters. Try changing your search.</div>';

  document.getElementById('eventResults').innerHTML = `
    <div class="resultsline">
      <span>${list.length} events to explore</span>
      <span>Choose your next experience ↘</span>
    </div>
    <div class="eventgrid">${cards}</div>`;
}

function fillFilters() {
  const categories = Array.from(new Set(allEvents.map(function (e) { return e.cat; }))).sort();
  const venues = Array.from(new Set(allEvents.map(function (e) { return shortVenue(e.venue); })));

  document.getElementById('categoryFilter').innerHTML =
    '<option value="all">All categories</option>' +
    categories.map(function (c) { return `<option value="${c}">${c}</option>`; }).join('');

  document.getElementById('venueFilter').innerHTML =
    '<option value="all">All venues</option>' +
    venues.map(function (v) { return `<option value="${v}">${v}</option>`; }).join('');
}

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', function (ev) {
    state.search = ev.target.value;
    renderResults();
  });
  document.getElementById('categoryFilter').addEventListener('change', function (ev) {
    state.category = ev.target.value;
    renderResults();
  });
  document.getElementById('dateFilter').addEventListener('change', function (ev) {
    state.date = ev.target.value;
    renderResults();
  });
  document.getElementById('venueFilter').addEventListener('change', function (ev) {
    state.venue = ev.target.value;
    renderResults();
  });
  document.getElementById('sortSelect').addEventListener('change', function (ev) {
    state.sort = ev.target.value;
    renderResults();
  });
}

async function loadEvents() {
  try {
    allEvents = await apiGet('/api/events');
    fillFilters();
    bindFilters();
    renderResults();
  } catch (err) {
    document.getElementById('eventResults').innerHTML =
      '<div class="eventgrid"><div class="empty">Could not load events. Please make sure the server is running.</div></div>';
  }
}

loadEvents();
