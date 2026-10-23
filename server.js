const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);

const EVENTS_FILE = path.join(__dirname, 'data', 'events.json');
const REGISTRATIONS_FILE = path.join(__dirname, 'data', 'registrations.json');

const ALLOWED_COURSES = [
  'B.Tech · 1st Year',
  'B.Tech · 2nd Year',
  'B.Tech · 3rd Year',
  'B.Tech · 4th Year',
  'BCA',
  'MCA',
  'Other'
];

let memoryRegistrations = null;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadRegistrations() {
  if (IS_VERCEL) {
    if (memoryRegistrations === null) {
      memoryRegistrations = readJson(REGISTRATIONS_FILE);
    }
    return memoryRegistrations;
  }
  return readJson(REGISTRATIONS_FILE);
}

function saveRegistrations(list) {
  if (IS_VERCEL) {
    memoryRegistrations = list;
    return;
  }
  writeJson(REGISTRATIONS_FILE, list);
}

function withSeatInfo(event, registrations) {
  const taken = registrations.filter(function (r) {
    return r.eventId === event.id;
  }).length;
  const seatsLeft = Math.max(0, event.seats - taken);
  return Object.assign({}, event, {
    seatsLeft: seatsLeft,
    reserved: event.total - seatsLeft
  });
}

function generateRegistrationId(existing) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    id = 'EE-26-' + code;
  } while (existing.some(function (r) { return r.registrationId === id; }));
  return id;
}

app.get('/api/events', function (req, res) {
  const events = readJson(EVENTS_FILE);
  const registrations = loadRegistrations();
  res.json(events.map(function (e) { return withSeatInfo(e, registrations); }));
});

app.get('/api/events/:id', function (req, res) {
  const id = Number(req.params.id);
  const events = readJson(EVENTS_FILE);
  const registrations = loadRegistrations();
  const event = events.find(function (e) { return e.id === id; });
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  res.json(withSeatInfo(event, registrations));
});

app.post('/api/register', function (req, res) {
  const body = req.body || {};
  const fullName = String(body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const course = String(body.course || '').trim();
  const roll = String(body.roll || '').trim();
  const eventId = Number(body.eventId);

  if (fullName.length < 2) {
    return res.status(400).json({ message: 'Please enter your full name.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (ALLOWED_COURSES.indexOf(course) === -1) {
    return res.status(400).json({ message: 'Please select your course and year.' });
  }
  if (roll.length < 2) {
    return res.status(400).json({ message: 'Please enter your roll number.' });
  }

  const events = readJson(EVENTS_FILE);
  const registrations = loadRegistrations();
  const event = events.find(function (e) { return e.id === eventId; });

  if (!event) {
    return res.status(404).json({ message: 'Selected event does not exist.' });
  }

  const info = withSeatInfo(event, registrations);
  if (info.seatsLeft <= 0) {
    return res.status(409).json({ message: 'Sorry, this event is full. Choose another event.' });
  }

  const duplicate = registrations.some(function (r) {
    return r.email === email; 
  });
  if (duplicate) {
    return res.status(409).json({ message: 'This email is already registered for this event.' });
  }

  const registration = {
    registrationId: generateRegistrationId(registrations),
    eventId: eventId,
    fullName: fullName,
    email: email,
    course: course,
    roll: roll,
    registeredAt: new Date().toISOString()
  };

  const updatedList = registrations.concat([registration]);
  saveRegistrations(updatedList);

  const updated = withSeatInfo(event, updatedList);
  res.status(201).json({
    message: 'Registration successful.',
    registrationId: registration.registrationId,
    registration: registration,
    event: updated
  });
});

app.use('/api', function (req, res) {
  res.status(404).json({ message: 'API route not found.' });
});

app.use(function (err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 400
    ? 'Invalid request data.'
    : 'Something went wrong on the server. Please try again.';
  res.status(status).json({ message: message });
});

if (require.main === module) {
  app.listen(PORT, function () {
    console.log('EventEase is running at http://localhost:' + PORT);
  });
}

module.exports = app;
