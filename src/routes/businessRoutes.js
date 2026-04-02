const express = require('express');
const router = express.Router();
const { db } = require('../models/db');

// Get business settings
router.get('/', (req, res) => {
    db.get("SELECT * FROM business WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// Update business settings
router.post('/', (req, res) => {
    const { name, tagline, email, phone, address, hours, instagram, tiktok, theme, customPrimary, customAccent, customSoft, customBodyBg, customAdminBg, bgImage, googleApiKey, googleCalendarId } = req.body;
    db.run(`UPDATE business SET name=?, tagline=?, email=?, phone=?, address=?, hours=?, instagram=?, tiktok=?, theme=?, customPrimary=?, customAccent=?, customSoft=?, customBodyBg=?, customAdminBg=?, bgImage=?, googleApiKey=?, googleCalendarId=? WHERE id=1`,
        [name, tagline, email, phone, address, hours, instagram, tiktok, theme, customPrimary, customAccent, customSoft, customBodyBg, customAdminBg, bgImage, googleApiKey, googleCalendarId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

module.exports = router;
