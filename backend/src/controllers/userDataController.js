const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Controller for user data endpoints
 */
const userDataController = {
  /**
   * Get user's watchlist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getWatchlist(req, res) {
    try {
      const userId = req.user.id;
      
      logger.info(`Fetching watchlist for user ${userId}`);
      
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({
        success: true,
        watchlist: data
      });
    } catch (error) {
      logger.error(`Error fetching watchlist: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch watchlist: ${error.message}`
      });
    }
  },
  
  /**
   * Add item to watchlist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async addToWatchlist(req, res) {
    try {
      const userId = req.user.id;
      const { source, seriesId, label } = req.body;
      
      // Validate required parameters
      if (!source || !seriesId) {
        return res.status(400).json({
          success: false,
          error: 'source and seriesId are required parameters'
        });
      }
      
      logger.info(`Adding item to watchlist for user ${userId}`, { 
        source, seriesId, label 
      });
      
      // Check if item already exists in watchlist
      const { data: existingItems, error: checkError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .eq('source', source)
        .eq('series_id', seriesId);
      
      if (checkError) throw checkError;
      
      if (existingItems && existingItems.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Item already exists in watchlist'
        });
      }
      
      // Add item to watchlist
      const { data, error } = await supabase
        .from('watchlists')
        .insert([
          {
            user_id: userId,
            source,
            series_id: seriesId,
            label: label || null
          }
        ])
        .select();
      
      if (error) throw error;
      
      res.json({
        success: true,
        item: data[0]
      });
    } catch (error) {
      logger.error(`Error adding to watchlist: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to add to watchlist: ${error.message}`
      });
    }
  },
  
  /**
   * Remove item from watchlist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async removeFromWatchlist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      logger.info(`Removing item from watchlist for user ${userId}`, { id });
      
      // Check if item exists and belongs to user
      const { data: existingItem, error: checkError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (checkError) {
        return res.status(404).json({
          success: false,
          error: 'Item not found in watchlist'
        });
      }
      
      // Remove item from watchlist
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Item removed from watchlist'
      });
    } catch (error) {
      logger.error(`Error removing from watchlist: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to remove from watchlist: ${error.message}`
      });
    }
  },
  
  /**
   * Get user's pies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getPies(req, res) {
    try {
      const userId = req.user.id;
      
      logger.info(`Fetching pies for user ${userId}`);
      
      // Get pies
      const { data: pies, error: piesError } = await supabase
        .from('pies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (piesError) throw piesError;
      
      // Get pie items for each pie
      const pieIds = pies.map(pie => pie.id);
      
      const { data: pieItems, error: itemsError } = await supabase
        .from('pie_items')
        .select('*')
        .in('pie_id', pieIds)
        .order('created_at', { ascending: false });
      
      if (itemsError) throw itemsError;
      
      // Group pie items by pie ID
      const pieItemsMap = pieItems.reduce((map, item) => {
        if (!map[item.pie_id]) {
          map[item.pie_id] = [];
        }
        map[item.pie_id].push(item);
        return map;
      }, {});
      
      // Add items to each pie
      const piesWithItems = pies.map(pie => ({
        ...pie,
        items: pieItemsMap[pie.id] || []
      }));
      
      res.json({
        success: true,
        pies: piesWithItems
      });
    } catch (error) {
      logger.error(`Error fetching pies: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch pies: ${error.message}`
      });
    }
  },
  
  /**
   * Create a new pie
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async createPie(req, res) {
    try {
      const userId = req.user.id;
      const { name, type, items } = req.body;
      
      // Validate required parameters
      if (!name || !type || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'name, type, and items array are required parameters'
        });
      }
      
      // Validate pie type
      const validTypes = ['buy', 'sell', 'black_swan'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid pie type. Must be one of: ${validTypes.join(', ')}`
        });
      }
      
      logger.info(`Creating pie for user ${userId}`, { name, type });
      
      // Start a transaction
      const { data: pie, error: pieError } = await supabase
        .from('pies')
        .insert([
          {
            user_id: userId,
            name,
            type
          }
        ])
        .select()
        .single();
      
      if (pieError) throw pieError;
      
      // Prepare pie items
      const pieItems = items.map(item => ({
        pie_id: pie.id,
        source: item.source,
        series_id: item.seriesId,
        weight: item.weight || 1,
        label: item.label || null
      }));
      
      // Insert pie items
      const { data: createdItems, error: itemsError } = await supabase
        .from('pie_items')
        .insert(pieItems)
        .select();
      
      if (itemsError) {
        // If inserting items fails, delete the pie
        await supabase
          .from('pies')
          .delete()
          .eq('id', pie.id);
        
        throw itemsError;
      }
      
      res.json({
        success: true,
        pie: {
          ...pie,
          items: createdItems
        }
      });
    } catch (error) {
      logger.error(`Error creating pie: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to create pie: ${error.message}`
      });
    }
  },
  
  /**
   * Delete a pie
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async deletePie(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      logger.info(`Deleting pie for user ${userId}`, { id });
      
      // Check if pie exists and belongs to user
      const { data: existingPie, error: checkError } = await supabase
        .from('pies')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (checkError) {
        return res.status(404).json({
          success: false,
          error: 'Pie not found'
        });
      }
      
      // Delete pie (cascade will delete pie items)
      const { error } = await supabase
        .from('pies')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Pie deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting pie: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to delete pie: ${error.message}`
      });
    }
  },
  
  /**
   * Get saved calculations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getSavedCalculations(req, res) {
    try {
      const userId = req.user.id;
      
      logger.info(`Fetching saved calculations for user ${userId}`);
      
      const { data, error } = await supabase
        .from('saved_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.json({
        success: true,
        calculations: data
      });
    } catch (error) {
      logger.error(`Error fetching saved calculations: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to fetch saved calculations: ${error.message}`
      });
    }
  },
  
  /**
   * Save a calculation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async saveCalculation(req, res) {
    try {
      const userId = req.user.id;
      const { name, formula, inputSeries } = req.body;
      
      // Validate required parameters
      if (!name || !formula || !inputSeries) {
        return res.status(400).json({
          success: false,
          error: 'name, formula, and inputSeries are required parameters'
        });
      }
      
      logger.info(`Saving calculation for user ${userId}`, { name, formula });
      
      const { data, error } = await supabase
        .from('saved_calculations')
        .insert([
          {
            user_id: userId,
            name,
            formula,
            input_series: inputSeries
          }
        ])
        .select();
      
      if (error) throw error;
      
      res.json({
        success: true,
        calculation: data[0]
      });
    } catch (error) {
      logger.error(`Error saving calculation: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to save calculation: ${error.message}`
      });
    }
  },
  
  /**
   * Delete a saved calculation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteCalculation(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      logger.info(`Deleting calculation for user ${userId}`, { id });
      
      // Check if calculation exists and belongs to user
      const { data: existingCalc, error: checkError } = await supabase
        .from('saved_calculations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (checkError) {
        return res.status(404).json({
          success: false,
          error: 'Calculation not found'
        });
      }
      
      // Delete calculation
      const { error } = await supabase
        .from('saved_calculations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Calculation deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting calculation: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: `Failed to delete calculation: ${error.message}`
      });
    }
  }
};

module.exports = userDataController;