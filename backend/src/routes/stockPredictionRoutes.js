const express = require('express');
const stockPredictionController = require('../controllers/stockPredictionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Stock Prediction Routes (protected by auth middleware)
router.post('/train', authMiddleware, stockPredictionController.trainModel);
router.post('/predict', authMiddleware, stockPredictionController.predictStockPrices);

module.exports = router;