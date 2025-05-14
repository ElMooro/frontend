import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Define types for API responses
export interface HistoricalSignal {
  date: string;
  signal: 'buy' | 'sell' | 'neutral';
  actualReturn: number;
}

export interface AccuracyStats {
  correct: number;
  total: number;
  accuracy: number;
}

export interface SignalAccuracyStats {
  buy: AccuracyStats;
  sell: AccuracyStats;
  neutral: AccuracyStats;
  overall: AccuracyStats;
}

export interface HistoricalSignalsResponse {
  success: boolean;
  signals: HistoricalSignal[];
  stats: SignalAccuracyStats;
}

/**
 * AI Analysis API client
 */
const aiAnalysisApi = {
  /**
   * Analyze market data and provide comprehensive predictions
   * @param symbol - Market symbol
   * @param timeframe - Data timeframe (daily, weekly, monthly)
   * @returns Analysis results
   */
  async analyzeMarket(symbol: string, timeframe: string = 'daily'): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/ai-analysis/market`, {
        params: { symbol, timeframe },
        withCredentials: true // Include auth cookies if available
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing market:', error);
      throw error;
    }
  },
  
  /**
   * Get trend prediction for a symbol
   * @param symbol - Market symbol
   * @param timeframe - Data timeframe (daily, weekly, monthly)
   * @returns Trend prediction
   */
  async getTrendPrediction(symbol: string, timeframe: string = 'daily'): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/ai-analysis/trend`, {
        params: { symbol, timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting trend prediction:', error);
      throw error;
    }
  },
  
  /**
   * Detect potential market tops and bottoms
   * @param symbol - Market symbol
   * @param timeframe - Data timeframe (daily, weekly, monthly)
   * @returns Turning points detection
   */
  async detectTurningPoints(symbol: string, timeframe: string = 'daily'): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/ai-analysis/turning-points`, {
        params: { symbol, timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting turning points:', error);
      throw error;
    }
  },
  
  /**
   * Predict liquidity regime
   * @returns Liquidity regime prediction
   */
  async predictLiquidityRegime(): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/ai-analysis/liquidity-regime`);
      return response.data;
    } catch (error) {
      console.error('Error predicting liquidity regime:', error);
      throw error;
    }
  },
  
  /**
   * Get historical signal accuracy data
   * @param symbol - Market symbol (optional)
   * @param limit - Maximum number of signals to return
   * @returns Historical signals and accuracy stats
   */
  async getHistoricalSignals(symbol: string, limit: number = 20): Promise<HistoricalSignalsResponse> {
    try {
      const response = await axios.get(`${API_URL}/ai-analysis/historical-signals`, {
        params: { symbol, limit },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical signals:', error);
      throw error;
    }
  },
  
  /**
   * Train AI models (admin only)
   * @returns Training results
   */
  async trainModels(): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/ai-analysis/train`, {}, {
        withCredentials: true // Include auth cookies
      });
      return response.data;
    } catch (error) {
      console.error('Error training AI models:', error);
      throw error;
    }
  }
};

export default aiAnalysisApi;