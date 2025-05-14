const express = require('express');
const censusController = require('../controllers/censusController');

const router = express.Router();

/**
 * @route   GET /api/economic-data/census/population
 * @desc    Get population data from Census
 * @access  Public
 */
router.get('/population', censusController.getPopulationData);

/**
 * @route   GET /api/economic-data/census/economic-indicators
 * @desc    Get economic indicators from Census
 * @access  Public
 */
router.get('/economic-indicators', censusController.getEconomicIndicators);

/**
 * @route   GET /api/economic-data/census/housing
 * @desc    Get housing data from Census
 * @access  Public
 */
router.get('/housing', censusController.getHousingData);

/**
 * @route   GET /api/economic-data/census/income
 * @desc    Get income data from Census
 * @access  Public
 */
router.get('/income', censusController.getIncomeData);

module.exports = router;