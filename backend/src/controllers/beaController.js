const { beaService } = require('../services/api');

/**
 * Controller for BEA (Bureau of Economic Analysis) data
 */
const beaController = {
  /**
   * Get GDP data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getGDPData(req, res) {
    try {
      const { frequency, year, quarter, firstYear, lastYear } = req.query;
      
      const options = {
        frequency,
        year,
        quarter,
        firstYear,
        lastYear
      };
      
      const data = await beaService.getGDPData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getGDPData controller:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * Get Personal Income data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPersonalIncomeData(req, res) {
    try {
      const { frequency, year, quarter, firstYear, lastYear } = req.query;
      
      const options = {
        frequency,
        year,
        quarter,
        firstYear,
        lastYear
      };
      
      const data = await beaService.getPersonalIncomeData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getPersonalIncomeData controller:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * Get International Trade data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getInternationalTradeData(req, res) {
    try {
      const { frequency, direction, year, firstYear, lastYear } = req.query;
      
      const options = {
        frequency,
        direction,
        year,
        firstYear,
        lastYear
      };
      
      const data = await beaService.getInternationalTradeData(options);
      res.json(data);
    } catch (error) {
      console.error('Error in getInternationalTradeData controller:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = beaController;