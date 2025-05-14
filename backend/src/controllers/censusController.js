const { censusService } = require('../services/api');

/**
 * Controller for Census Bureau data
 */
const censusController = {
  /**
   * Get population data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPopulationData(req, res) {
    try {
      const { year, dataset, variables, geoLevel, geoIds } = req.query;
      
      const options = {
        year,
        dataset,
        variables,
        geoLevel,
        geoIds
      };
      
      const data = await censusService.getPopulationData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getPopulationData controller:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * Get economic indicators
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEconomicIndicators(req, res) {
    try {
      const { year, dataset, variables, geoLevel, geoIds } = req.query;
      
      const options = {
        year,
        dataset,
        variables,
        geoLevel,
        geoIds
      };
      
      const data = await censusService.getEconomicIndicators(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getEconomicIndicators controller:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * Get housing data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHousingData(req, res) {
    try {
      const { year, dataset, variables, geoLevel, geoIds } = req.query;
      
      const options = {
        year,
        dataset,
        variables,
        geoLevel,
        geoIds
      };
      
      const data = await censusService.getHousingData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getHousingData controller:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * Get income data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getIncomeData(req, res) {
    try {
      const { year, dataset, geoLevel, geoIds } = req.query;
      
      const options = {
        year,
        dataset,
        geoLevel,
        geoIds
      };
      
      const data = await censusService.getIncomeData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getIncomeData controller:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = censusController;