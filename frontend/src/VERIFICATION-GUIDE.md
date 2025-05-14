# AI Analysis Features Verification Guide

This guide will help you verify that the Delta and Trendline Slope features are working correctly in the AI Analysis Dashboard.

## What to Look For

### 1. Chart Display Mode Options

When you open the AI Analysis Dashboard, you should see a dropdown menu labeled "Display Mode" with the following options:
- Raw Values
- Delta (Change)
- Percent Change

![Display Mode Dropdown](https://i.imgur.com/example1.png)

### 2. Trendline Slope Toggle

Next to the Display Mode dropdown, you should see a checkbox labeled "Show Trendline Slope".

![Trendline Slope Toggle](https://i.imgur.com/example2.png)

### 3. Testing Different Display Modes

#### Raw Values Mode
- Shows the actual price trend over time
- Y-axis shows price values
- Line chart is displayed

![Raw Values Mode](https://i.imgur.com/example3.png)

#### Delta Mode
- Shows the absolute day-to-day movement
- Y-axis includes zero reference line
- Bar chart is displayed with green/red bars
- Green bars for positive changes, red bars for negative changes

![Delta Mode](https://i.imgur.com/example4.png)

#### Percent Change Mode
- Shows relative movement as percentages
- Y-axis includes zero reference line and shows percentages
- Bar chart is displayed with green/red bars
- Green bars for positive changes, red bars for negative changes

![Percent Change Mode](https://i.imgur.com/example5.png)

### 4. Trendline Slope Chart

When "Show Trendline Slope" is checked:
- A smaller chart appears below the main chart
- Shows the 7-day rolling linear regression slope
- Has a zero reference line
- Crosses zero at trend reversals

![Trendline Slope Chart](https://i.imgur.com/example6.png)

## Manual Testing Steps

1. Navigate to the AI Analysis Dashboard
2. Select a symbol (e.g., SPY, QQQ) and timeframe
3. Verify the Display Mode dropdown and Trendline Slope toggle are present
4. Try each display mode and observe the chart changes:
   - Raw Values: Line chart showing prices
   - Delta: Bar chart showing day-to-day changes
   - Percent Change: Bar chart showing percentage changes
5. Toggle the Trendline Slope checkbox on and off
6. Verify the Trendline Slope chart appears and disappears accordingly

## Automated Testing

You can also run the automated test script to verify the features:

1. Open the browser console (F12 or right-click > Inspect > Console)
2. Copy and paste the contents of `test-ai-analysis.js` into the console
3. Run the `testAIAnalysisFeatures()` function
4. Check the console for test results

## Expected Behavior

- Switching display modes should immediately update the chart
- The Trendline Slope chart should appear when the checkbox is checked
- The Trendline Slope chart should disappear when the checkbox is unchecked
- Delta and Percent Change modes should show bars instead of lines
- Bars should be colored green for positive changes and red for negative changes
- The Trendline Slope chart should show a line that crosses zero at trend reversals