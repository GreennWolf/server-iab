// src/controllers/tcfController.js
const tcfService = require('../services/tcfService');

const tcfController = {
    async validateConsent(req, res) {
        try {
            const validation = await tcfService.validateConsent(req.body);
            res.json(validation);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async generateTCString(req, res) {
        try {
            const result = await tcfService.createTCString(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async checkGDPR(req, res) {
        try {
            const { ip, domain } = req.body;
            const result = await tcfService.checkGDPRApplicability(ip, domain);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    async getVendorList(req, res) {
        try {
            const vendorList = tcfService.getVendorList();
            res.json({
                success: true,
                data: vendorList
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = tcfController;