const { fredService, treasuryService, blsService, beaService, censusService } = require('../services/api');
const logger = require('../utils/logger');
const calculations = require('../utils/calculations');

/**
 * Controller for economic data endpoints
 */
const economicDataController = {
  /**
   * Get data from FRED API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getFredData(req, res) {
    try {
      const { seriesId } = req.params;
      const { frequency, units, startDate, endDate, calculation } = req.query;
      
      logger.info(`Fetching FRED data for series ${seriesId}`, { 
        frequency, units, startDate, endDate, calculation 
      });
      
      // Get data from FRED API
      const data = await fredService.getSeriesData(seriesId, {
        frequency,
        units,
        startDate,
        endDate
      });
      
      // Get series info
      const seriesInfo = await fredService.getSeriesInfo(seriesId);
      
      // Apply calculation if specified
      let processedData = data.data;
      if (calculation) {
        switch (calculation) {
          case 'change':
            processedData = calculations.calculateChange(data.data);
            break;
          case 'pct_change':
            processedData = calculations.calculatePercentChange(data.data);
            break;
          case 'moving_avg':
            processedData = calculations.calculateMovingAverage(data.data, 7);
            break;
          case 'yoy_change':
            processedData = calculations.calculateYearOverYearChange(data.data);
            break;
          case 'yoy_pct_change':
            processedData = calculations.calculateYearOverYearPercentChange(data.data);
            break;
          default:
            // No calculation or unknown calculation type
            break;
        }
      }
      
      res.json({
        success: true,
        seriesId,
        title: seriesInfo.title,
        units: seriesInfo.units,
        frequency: seriesInfo.frequency,
        data: processedData
      });
    } catch (error) {
      logger.error(`Error fetching FRED data: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch FRED data: ${error.message}`
      });
    }
  },
  
  /**
   * Get data from Treasury API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getTreasuryData(req, res) {
    try {
      const { dataType } = req.params;
      const { startDate, endDate, limit } = req.query;
      
      logger.info(`Fetching Treasury data for type ${dataType}`, { 
        startDate, endDate, limit 
      });
      
      let data;
      
      // Get data based on data type
      switch (dataType) {
        case 'debt':
          data = await treasuryService.getDebtData({
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 100
          });
          break;
        case 'yield_curve':
          data = await treasuryService.getYieldCurveData({
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 100
          });
          break;
        case 'treasury_bills':
          data = await treasuryService.getTreasuryBillRates({
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 100
          });
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      res.json({
        success: true,
        dataType,
        data: data.data
      });
    } catch (error) {
      logger.error(`Error fetching Treasury data: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch Treasury data: ${error.message}`
      });
    }
  },
  
  /**
   * Get data from BLS API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getBlsData(req, res) {
    try {
      const { dataType } = req.params;
      const { startYear, endYear, seriesIds } = req.query;
      
      // Validate required parameters
      if (!startYear || !endYear) {
        return res.status(400).json({
          success: false,
          error: 'startYear and endYear are required parameters'
        });
      }
      
      logger.info(`Fetching BLS data for type ${dataType}`, { 
        startYear, endYear, seriesIds 
      });
      
      let data;
      
      // Get data based on data type
      switch (dataType) {
        case 'cpi':
          data = await blsService.getCPIData(
            parseInt(startYear),
            parseInt(endYear)
          );
          break;
        case 'unemployment':
          data = await blsService.getUnemploymentData(
            parseInt(startYear),
            parseInt(endYear)
          );
          break;
        case 'employment':
          data = await blsService.getEmploymentData(
            parseInt(startYear),
            parseInt(endYear)
          );
          break;
        case 'custom':
          // For custom series IDs
          if (!seriesIds) {
            return res.status(400).json({
              success: false,
              error: 'seriesIds is required for custom data type'
            });
          }
          
          // Parse series IDs
          const seriesIdArray = Array.isArray(seriesIds) 
            ? seriesIds 
            : seriesIds.split(',');
          
          data = await blsService.getData(
            seriesIdArray,
            parseInt(startYear),
            parseInt(endYear)
          );
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      res.json({
        success: true,
        dataType,
        data
      });
    } catch (error) {
      logger.error(`Error fetching BLS data: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch BLS data: ${error.message}`
      });
    }
  },

  /**
   * Get data from BEA API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getBeaData(req, res) {
    try {
      const { dataType } = req.params;
      const { frequency, year, quarter, firstYear, lastYear, direction } = req.query;
      
      logger.info(`Fetching BEA data for type ${dataType}`, { 
        frequency, year, quarter, firstYear, lastYear, direction 
      });
      
      // Check if BEA service is available
      if (!beaService) {
        throw new Error('BEA service is not available');
      }
      
      let data;
      
      // Get data based on data type
      switch (dataType) {
        case 'gdp':
          data = await beaService.getGDPData({
            frequency,
            year,
            quarter,
            firstYear,
            lastYear
          });
          break;
        case 'personal_income':
          data = await beaService.getPersonalIncomeData({
            frequency,
            year,
            quarter,
            firstYear,
            lastYear
          });
          break;
        case 'international_trade':
          data = await beaService.getInternationalTradeData({
            frequency,
            direction,
            year,
            firstYear,
            lastYear
          });
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      // Check if data is valid
      if (!data || !data.data) {
        throw new Error('Invalid data received from BEA API');
      }
      
      res.json({
        success: true,
        dataType,
        data: data.data
      });
    } catch (error) {
      logger.error(`Error fetching BEA data: ${error.message}`, { error });
      
      // Return a more graceful error response with empty data
      res.status(200).json({
        success: false,
        dataType: req.params.dataType,
        error: `Failed to fetch BEA data: ${error.message}`,
        data: [] // Return empty data array for graceful degradation
      });
    }
  },

  /**
   * Get data from Census API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getCensusData(req, res) {
    try {
      const { dataType } = req.params;
      const { year, dataset, variables, geoLevel, geoIds } = req.query;
      
      logger.info(`Fetching Census data for type ${dataType}`, { 
        year, dataset, variables, geoLevel, geoIds 
      });
      
      let data;
      
      // Get data based on data type
      switch (dataType) {
        case 'population':
          data = await censusService.getPopulationData({
            year,
            dataset,
            variables,
            geoLevel,
            geoIds
          });
          break;
        case 'economic_indicators':
          data = await censusService.getEconomicIndicators({
            year,
            dataset,
            variables,
            geoLevel,
            geoIds
          });
          break;
        case 'housing':
          data = await censusService.getHousingData({
            year,
            dataset,
            variables,
            geoLevel,
            geoIds
          });
          break;
        case 'income':
          data = await censusService.getIncomeData({
            year,
            dataset,
            geoLevel,
            geoIds
          });
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      res.json({
        success: true,
        dataType,
        data: data.data
      });
    } catch (error) {
      logger.error(`Error fetching Census data: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch Census data: ${error.message}`
      });
    }
  }
};

module.exports = economicDataController;