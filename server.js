const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Setup Tables
db.serialize(() => {
    // Services table
    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        duration INTEGER,
        price REAL,
        description TEXT
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        customerEmail TEXT,
        customerPhone TEXT,
        notes TEXT,
        serviceId INTEGER,
        serviceName TEXT,
        servicePrice REAL,
        date TEXT,
        time TEXT,
        status TEXT,
        createdAt TEXT,
        googleCalendarEventId TEXT
    )`);

    // Business settings table
    db.run(`CREATE TABLE IF NOT EXISTS business (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT, tagline TEXT, email TEXT, phone TEXT, address TEXT, hours TEXT, instagram TEXT, tiktok TEXT, theme TEXT,
        customPrimary TEXT, customAccent TEXT, customSoft TEXT, customBodyBg TEXT, customAdminBg TEXT, bgImage TEXT,
        googleApiKey TEXT, googleCalendarId TEXT
    )`);
    // Safety check for existing DBs
    db.run(`ALTER TABLE business ADD COLUMN theme TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN customPrimary TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN customAccent TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN customSoft TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN customBodyBg TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN customAdminBg TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN bgImage TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN googleApiKey TEXT`, (err) => {  });
    db.run(`ALTER TABLE business ADD COLUMN googleCalendarId TEXT`, (err) => {  });

    // Blocked Slots table
    db.run(`CREATE TABLE IF NOT EXISTS blocked_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT
    )`);

    // Gallery table
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT
    )`);

    // Admin table
    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password TEXT
    )`);

    // Initial data
    db.get("SELECT COUNT(*) as count FROM admin", (err, row) => {
        if (!err && row.count === 0) {
            db.run(`INSERT INTO admin (id, password) VALUES (1, 'admin123')`);
        }
    });

    db.get("SELECT COUNT(*) as count FROM business", (err, row) => {
        if (!err && row.count === 0) {
            db.run(`INSERT INTO business (id, name, tagline, email, phone, address, hours, instagram, tiktok) 
                VALUES (1, 'Luxe Salon & Spa', 'Premium beauty and wellness services', 'bookings@luxesalon.com', '+1 (555) 123-4567', '123 Beauty Lane, NY', 'Mon-Sat: 9AM-7PM', '', '')`);
        }
    });

    db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO services (name, duration, price, description) VALUES (?, ?, ?, ?)`);
            stmt.run('Hair Styling', 60, 75, 'Professional cut and style');
            stmt.run('Massage Therapy', 90, 120, 'Relaxing deep tissue');
            stmt.finalize();
        }
    });
});

// --- API Endpoints ---

// Business Settings
app.get('/api/business', (req, res) => {
    db.get("SELECT * FROM business WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.post('/api/business', (req, res) => {
    const { name, tagline, email, phone, address, hours, instagram, tiktok, theme, customPrimary, customAccent, customSoft, customBodyBg, customAdminBg, bgImage, googleApiKey, googleCalendarId } = req.body;
    db.run(`UPDATE business SET name=?, tagline=?, email=?, phone=?, address=?, hours=?, instagram=?, tiktok=?, theme=?, customPrimary=?, customAccent=?, customSoft=?, customBodyBg=?, customAdminBg=?, bgImage=?, googleApiKey=?, googleCalendarId=? WHERE id=1`,
        [name, tagline, email, phone, address, hours, instagram, tiktok, theme, customPrimary, customAccent, customSoft, customBodyBg, customAdminBg, bgImage, googleApiKey, googleCalendarId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Services
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/services', (req, res) => {
    const { name, duration, price, description } = req.body;
    db.run(`INSERT INTO services (name, duration, price, description) VALUES (?, ?, ?, ?)`,
        [name, duration, price, description], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/services/:id', (req, res) => {
    const { name, duration, price, description } = req.body;
    db.run(`UPDATE services SET name=?, duration=?, price=?, description=? WHERE id=?`,
        [name, duration, price, description, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.delete('/api/services/:id', (req, res) => {
    db.run(`DELETE FROM services WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Bookings
app.get('/api/bookings', (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY createdAt DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/bookings', (req, res) => {
    const b = req.body;
    db.run(`INSERT INTO bookings (customerName, customerEmail, customerPhone, notes, serviceId, serviceName, servicePrice, date, time, status, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.customerName, b.customerEmail, b.customerPhone, b.notes, b.serviceId, b.serviceName, b.servicePrice, b.date, b.time, b.status, b.createdAt],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

app.put('/api/bookings/:id', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE bookings SET status=? WHERE id=?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/bookings/:id', (req, res) => {
    db.run(`DELETE FROM bookings WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Gallery
app.get('/api/gallery', (req, res) => {
    db.all("SELECT * FROM gallery", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.url));
    });
});

app.post('/api/gallery', (req, res) => {
    db.run(`INSERT INTO gallery (url) VALUES (?)`, [req.body.url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/upload', upload.array('images'), (req, res) => {
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    const stmt = db.prepare(`INSERT INTO gallery (url) VALUES (?)`);
    urls.forEach(url => stmt.run(url));
    stmt.finalize(err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, urls });
    });
});

app.post('/api/upload-bg', upload.array('images'), (req, res) => {
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, urls });
});

// Availability / Blocked Slots
app.get('/api/availability', (req, res) => {
    db.all("SELECT * FROM blocked_slots", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/availability', (req, res) => {
    const { date, time } = req.body;
    db.run(`INSERT INTO blocked_slots (date, time) VALUES (?, ?)`, [date, time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.delete('/api/availability', (req, res) => {
    const { date, time } = req.body;
    db.run(`DELETE FROM blocked_slots WHERE date=? AND (time=? OR time='ALL')`, [date, time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/availability/bulk', (req, res) => {
    const { dates, block } = req.body; // Array of date strings, block boolean
    if (block) {
        const stmt = db.prepare(`INSERT INTO blocked_slots (date, time) VALUES (?, 'ALL')`);
        dates.forEach(d => stmt.run(d));
        stmt.finalize(err => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        const placeholders = dates.map(() => '?').join(',');
        db.run(`DELETE FROM blocked_slots WHERE date IN (${placeholders})`, dates, err => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
});

app.delete('/api/gallery', (req, res) => {
    // Delete by URL or ID? Let's say by URL for simplicity in this case
    db.run(`DELETE FROM gallery WHERE url=?`, [req.body.url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Admin Auth
app.post('/api/admin/login', (req, res) => {
    db.get("SELECT password FROM admin WHERE id=1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.password === req.body.password) res.json({ success: true });
        else res.status(401).json({ success: false, message: "Invalid password" });
    });
});

app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    db.get("SELECT password FROM admin WHERE id=1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.password === currentPassword) {
            db.run("UPDATE admin SET password=? WHERE id=1", [newPassword], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid current password" });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
