const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Get gallery images
router.get('/', (req, res) => {
    db.all("SELECT * FROM gallery", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.url));
    });
});

// Add image manually
router.post('/', (req, res) => {
    db.run(`INSERT INTO gallery (url) VALUES (?)`, [req.body.url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Delete image
router.delete('/', (req, res) => {
    db.run(`DELETE FROM gallery WHERE url=?`, [req.body.url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
