const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Get all bookings
router.get('/', (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY createdAt DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create booking
router.post('/', (req, res) => {
    const b = req.body;
    db.run(`INSERT INTO bookings (customerName, customerEmail, customerPhone, notes, serviceId, serviceName, servicePrice, date, time, status, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.customerName, b.customerEmail, b.customerPhone, b.notes, b.serviceId, b.serviceName, b.servicePrice, b.date, b.time, b.status, b.createdAt],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

// Update booking status
router.put('/:id', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE bookings SET status=? WHERE id=?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Delete booking
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM bookings WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
