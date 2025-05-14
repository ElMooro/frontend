const express = require('express');
const aiAnalysisController = require('../controllers/aiAnalysisController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/ai-analysis/market
 * @desc    Analyze market data and provide comprehensive predictions
 * @access  Public (optional auth)
 */
router.get('/market', authMiddleware.optionalAuth, aiAnalysisController.analyzeMarket.bind(aiAnalysisController));

/**
 * @route   GET /api/ai-analysis/trend
 * @desc    Get trend prediction for a symbol
 * @access  Public
 */
router.get('/trend', aiAnalysisController.getTrendPrediction.bind(aiAnalysisController));

/**
 * @route   GET /api/ai-analysis/turning-points
 * @desc    Detect potential market tops and bottoms
 * @access  Public
 */
router.get('/turning-points', aiAnalysisController.detectTurningPoints.bind(aiAnalysisController));

/**
 * @route   GET /api/ai-analysis/liquidity-regime
 * @desc    Predict liquidity regime
 * @access  Public
 */
router.get('/liquidity-regime', aiAnalysisController.predictLiquidityRegime.bind(aiAnalysisController));

/**
 * @route   GET /api/ai-analysis/historical-signals
 * @desc    Get historical trading signals and their accuracy
 * @access  Public (optional auth)
 */
router.get('/historical-signals', authMiddleware.optionalAuth, aiAnalysisController.getHistoricalSignals.bind(aiAnalysisController));

/**
 * @route   POST /api/ai-analysis/train
 * @desc    Train AI models with historical data
 * @access  Private (admin only)
 */
router.post('/train', authMiddleware.requireAuth, authMiddleware.requireAdmin, aiAnalysisController.trainModels.bind(aiAnalysisController));

module.exports = router;