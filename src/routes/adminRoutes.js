const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Admin login
router.post('/login', (req, res) => {
    db.get("SELECT password FROM admin WHERE id=1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.password === req.body.password) res.json({ success: true });
        else res.status(401).json({ success: false, message: "Invalid password" });
    });
});

// Change password
router.post('/change-password', (req, res) => {
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

module.exports = router;
