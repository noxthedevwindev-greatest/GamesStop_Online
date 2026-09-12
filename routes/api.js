const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

router.get('/profile/:code', async (req, res) => {
  try {
    let profile = await Profile.findOne({ code: req.params.code });

    if (!profile) {
      profile = await Profile.create({
        code: req.params.code,
        name: 'Unknown Player',
        games: [],
        ip: null,
        settings: { ipLock: false, showOnLogin: true, theme: 'dark' },
        bio: { age: '', favGame: '', discord: '' }
      });
      return res.json({ profile, isNew: true });
    }

    const clientIP = getClientIP(req);

    if (profile.settings.ipLock && profile.ip) {
      if (profile.ip !== clientIP) {
        return res.status(403).json({ error: 'IP verification failed. This code is locked to another IP.' });
      }
    }

    if (profile.settings.ipLock && !profile.ip) {
      profile.ip = clientIP;
      await profile.save();
    }

    res.json({ profile, isNew: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile/:code/update-ip', async (req, res) => {
  try {
    const profile = await Profile.findOne({ code: req.params.code });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const clientIP = getClientIP(req);
    profile.ip = clientIP;
    await profile.save();

    res.json({ success: true, ip: clientIP });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile/:code/settings', async (req, res) => {
  try {
    const profile = await Profile.findOne({ code: req.params.code });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (req.body.settings) {
      profile.settings = { ...profile.settings, ...req.body.settings };
    }
    if (req.body.name !== undefined) {
      profile.name = req.body.name;
    }
    if (req.body.bio) {
      profile.bio = { ...profile.bio, ...req.body.bio };
    }
    await profile.save();

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().select('-__v');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
