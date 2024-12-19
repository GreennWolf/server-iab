// src/routes/tcf.routes.js
const express = require('express');
const router = express.Router();
const tcfController = require('../controllers/tcfController');

// Rutas para TCF
router.post('/validate', tcfController.validateConsent);
router.post('/generate', tcfController.generateTCString);
router.post('/gdpr-check', tcfController.checkGDPR);
router.get('/vendor-list', tcfController.getVendorList);

module.exports = router;