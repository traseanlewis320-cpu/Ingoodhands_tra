const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Get blocked slots
router.get('/', (req, res) => {
    db.all("SELECT * FROM blocked_slots", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add blocked slot
router.post('/', (req, res) => {
    const { date, time } = req.body;
    db.run(`INSERT INTO blocked_slots (date, time) VALUES (?, ?)`, [date, time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Delete blocked slot
router.delete('/', (req, res) => {
    const { date, time } = req.body;
    db.run(`DELETE FROM blocked_slots WHERE date=? AND (time=? OR time='ALL')`, [date, time], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Bulk availability
router.post('/bulk', (req, res) => {
    const { dates, block } = req.body;
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

module.exports = router;
