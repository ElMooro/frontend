# AI Analysis Module

This module provides advanced AI analysis capabilities for financial market data, implementing multiple AI model options to predict market trends, detect turning points, and forecast liquidity regimes.

## Chart Visualization Features

### 1. Multiple Data Display Modes
- **Raw Values**: Shows the actual price trend over time
- **Delta**: Shows the absolute day-to-day movement (today - yesterday)
  - Great for spotting volatility and momentum changes
  - Helps track how fast something is rising or falling
  - Provides sensitivity to small directional shifts
- **Percent Change**: Shows relative movement ((today - yesterday) / yesterday * 100)
  - Ideal for comparing movements across assets of different scales

### 2. Trendline Slope Indicator
- Calculated via 7-day rolling linear regression
- When slope flattens or crosses zero, it often signals a trend weakening or reversal
- Helps detect early flattening before a full reversal
- Provides mathematical confirmation of trend strength

## Features

### 1. Trend Direction Prediction
- Predicts whether the market trend is up, down, or stable
- Uses LSTM/GRU neural networks for sequence forecasting
- Provides confidence scores for each prediction

### 2. Tops & Bottoms Detection (Turning Points)
- Identifies potential market tops and bottoms
- Uses Autoencoder neural networks for anomaly detection
- Calculates anomaly scores to quantify the likelihood of a turning point

### 3. Liquidity Regime Prediction
- Forecasts future liquidity conditions (tightening or easing)
- Uses Transformer models to analyze macro indicators
- Helps anticipate changes in market conditions due to liquidity shifts

## AI Model Options

| Model Type | Use Case | Strengths |
|------------|----------|-----------|
| LSTM / GRU | Sequence forecasting | Great for price trend prediction |
| Random Forest / XGBoost | Trend classification | Fast, interpretable |
| Transformer Models | Event + time series | Powerful for complex data |
| Autoencoders | Anomaly detection | Find potential tops/bottoms |
| Reinforcement Learning | Trade strategy simulation | Best for future development |

## API Endpoints

### Market Analysis
```
GET /api/ai-analysis/market
```
Parameters:
- `symbol` (required): Market symbol (e.g., SPY, AAPL)
- `timeframe` (optional): Data timeframe (daily, weekly, monthly)

Returns comprehensive analysis including trend prediction, turning points detection, and liquidity regime forecast.

### Trend Prediction
```
GET /api/ai-analysis/trend
```
Parameters:
- `symbol` (required): Market symbol
- `timeframe` (optional): Data timeframe

Returns trend direction prediction with confidence scores.

### Turning Points Detection
```
GET /api/ai-analysis/turning-points
```
Parameters:
- `symbol` (required): Market symbol
- `timeframe` (optional): Data timeframe

Returns anomaly detection results for potential market tops and bottoms.

### Liquidity Regime Prediction
```
GET /api/ai-analysis/liquidity-regime
```
Returns forecast of future liquidity conditions (tightening or easing).

### Train Models (Admin Only)
```
POST /api/ai-analysis/train
```
Trains all AI models with historical data. Requires admin authentication.

## Implementation Details

### Data Sources
The AI models use data from multiple sources:
- Market price data (OHLCV)
- Economic indicators from FRED, Treasury, BLS
- Liquidity metrics (Fed Funds Rate, Treasury yields, etc.)

### Model Architecture

#### LSTM Model
- Input: 30 days of normalized OHLCV data
- Architecture: 2-layer LSTM with dropout
- Output: 3 classes (up, down, stable)

#### Autoencoder Model
- Input: 30 days of normalized price data
- Architecture: Encoder-decoder with bottleneck
- Output: Reconstruction error (anomaly score)

#### Transformer Model
- Input: 60 days of macro indicators
- Architecture: Simplified transformer with self-attention
- Output: 2 classes (tightening, easing)

## Usage Example

```javascript
// Frontend example
import aiAnalysisApi from '../services/aiAnalysisApi';

// Get comprehensive analysis
const analysis = await aiAnalysisApi.analyzeMarket('SPY', 'daily');

// Access predictions
const trendDirection = analysis.analysis.trend.trendDirection;
const isTurningPoint = analysis.analysis.turningPoints.isAnomalous;
const liquidityRegime = analysis.analysis.liquidityRegime.liquidityRegime;

// Get summary
const summary = analysis.analysis.summary;
```

## Future Enhancements

1. **Model Ensemble**: Combine multiple model types for more robust predictions
2. **Reinforcement Learning**: Implement RL for trade strategy optimization
3. **Sentiment Analysis**: Incorporate news and social media sentiment
4. **Alternative Data**: Add support for order flow, options data, etc.
5. **Explainable AI**: Improve transparency of model decisions