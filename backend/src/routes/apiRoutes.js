const express = require('express');
const { economicDataController, userDataController, mlController } = require('../controllers');
const aiAnalysisController = require('../controllers/aiAnalysisController');
const authMiddleware = require('../middleware/authMiddleware');
const aiAnalysisRoutes = require('./aiAnalysisRoutes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Economic Data Routes
router.get('/economic-data/fred/:seriesId', economicDataController.getFredData);
router.get('/economic-data/treasury/:dataType', economicDataController.getTreasuryData);
router.get('/economic-data/bls/:dataType', economicDataController.getBlsData);
router.get('/economic-data/bea/:dataType', economicDataController.getBeaData);
router.get('/economic-data/census/:dataType', economicDataController.getCensusData);

// User Data Routes (protected by auth middleware)
router.get('/user/watchlist', authMiddleware.requireAuth, userDataController.getWatchlist);
router.post('/user/watchlist', authMiddleware.requireAuth, userDataController.addToWatchlist);
router.delete('/user/watchlist/:id', authMiddleware.requireAuth, userDataController.removeFromWatchlist);

router.get('/user/pies', authMiddleware.requireAuth, userDataController.getPies);
router.post('/user/pies', authMiddleware.requireAuth, userDataController.createPie);
router.delete('/user/pies/:id', authMiddleware.requireAuth, userDataController.deletePie);

router.get('/user/calculations', authMiddleware.requireAuth, userDataController.getSavedCalculations);
router.post('/user/calculations', authMiddleware.requireAuth, userDataController.saveCalculation);
router.delete('/user/calculations/:id', authMiddleware.requireAuth, userDataController.deleteCalculation);

// ML Routes (protected by auth middleware)
router.get('/ml/signal/:pieId', authMiddleware.requireAuth, mlController.getSignal);
router.post('/ml/train', authMiddleware.requireAuth, mlController.trainModel);

// AI Analysis Routes
router.use('/ai-analysis', aiAnalysisRoutes);

module.exports = router;