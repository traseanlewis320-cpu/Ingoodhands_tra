const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error connecting to database:', err.message);
    else console.log(`Connected to database at ${dbPath}`);
});

const initDb = () => {
    db.serialize(() => {
        // Services table
        db.run(`CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
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

        // Seeding initial data
        db.get("SELECT COUNT(*) as count FROM admin", (err, row) => {
            if (!err && row.count === 0) {
                const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
                db.run(`INSERT INTO admin (id, password) VALUES (1, ?)`, [adminPass]);
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
};

module.exports = { db, initDb };
