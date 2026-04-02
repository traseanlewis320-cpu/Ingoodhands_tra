const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Get all services
router.get('/', (req, res) => {
    db.all("SELECT * FROM services", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add service
router.post('/', (req, res) => {
    const { name, duration, price, description } = req.body;
    db.run(`INSERT INTO services (name, duration, price, description) VALUES (?, ?, ?, ?)`,
        [name, duration, price, description], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
});

// Update service
router.put('/:id', (req, res) => {
    const { name, duration, price, description } = req.body;
    db.run(`UPDATE services SET name=?, duration=?, price=?, description=? WHERE id=?`,
        [name, duration, price, description, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete service
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM services WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
