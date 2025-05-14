const express = require('express');
const beaController = require('../controllers/beaController');

const router = express.Router();

/**
 * @route   GET /api/economic-data/bea/gdp
 * @desc    Get GDP data from BEA
 * @access  Public
 */
router.get('/gdp', beaController.getGDPData);

/**
 * @route   GET /api/economic-data/bea/personal-income
 * @desc    Get Personal Income data from BEA
 * @access  Public
 */
router.get('/personal-income', beaController.getPersonalIncomeData);

/**
 * @route   GET /api/economic-data/bea/international-trade
 * @desc    Get International Trade data from BEA
 * @access  Public
 */
router.get('/international-trade', beaController.getInternationalTradeData);

module.exports = router;