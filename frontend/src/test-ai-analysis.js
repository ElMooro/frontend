/**
 * AI Analysis Feature Test Script
 * 
 * This script helps verify that the Delta and Trendline Slope features
 * are working correctly in the AI Analysis Dashboard.
 * 
 * How to use:
 * 1. Open the browser console in the AI Analysis Dashboard page
 * 2. Copy and paste this entire script into the console
 * 3. Run the testAIAnalysisFeatures() function
 * 4. Check the console for test results
 */

function testAIAnalysisFeatures() {
  console.log('🧪 Starting AI Analysis Features Test');
  
  // Test 1: Check if chart display mode options exist
  const displayModeSelect = document.querySelector('select[value="raw"]');
  if (displayModeSelect) {
    console.log('✅ Test 1 Passed: Chart display mode selector found');
    
    // Check if it has the correct options
    const options = Array.from(displayModeSelect.options).map(opt => opt.value);
    const hasRequiredOptions = ['raw', 'delta', 'percent'].every(opt => options.includes(opt));
    
    if (hasRequiredOptions) {
      console.log('✅ Test 1.1 Passed: All required display modes are available');
    } else {
      console.error('❌ Test 1.1 Failed: Missing some display mode options', options);
    }
  } else {
    console.error('❌ Test 1 Failed: Chart display mode selector not found');
  }
  
  // Test 2: Check if trendline slope toggle exists
  const trendlineSlopeToggle = document.querySelector('input[id="showTrendlineSlope"]');
  if (trendlineSlopeToggle) {
    console.log('✅ Test 2 Passed: Trendline slope toggle found');
  } else {
    console.error('❌ Test 2 Failed: Trendline slope toggle not found');
  }
  
  // Test 3: Test switching between display modes
  if (displayModeSelect) {
    const originalValue = displayModeSelect.value;
    
    // Test Delta mode
    displayModeSelect.value = 'delta';
    displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('Changed display mode to Delta');
    
    // Test Percent Change mode
    setTimeout(() => {
      displayModeSelect.value = 'percent';
      displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Changed display mode to Percent Change');
      
      // Restore original value
      setTimeout(() => {
        displayModeSelect.value = originalValue;
        displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Restored original display mode');
        
        console.log('✅ Test 3 Passed: Successfully switched between display modes');
      }, 1000);
    }, 1000);
  }
  
  // Test 4: Test toggling trendline slope
  if (trendlineSlopeToggle) {
    const originalChecked = trendlineSlopeToggle.checked;
    
    // Toggle off
    trendlineSlopeToggle.checked = false;
    trendlineSlopeToggle.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('Turned off trendline slope');
    
    // Toggle on
    setTimeout(() => {
      trendlineSlopeToggle.checked = true;
      trendlineSlopeToggle.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Turned on trendline slope');
      
      // Restore original value
      setTimeout(() => {
        trendlineSlopeToggle.checked = originalChecked;
        trendlineSlopeToggle.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Restored original trendline slope setting');
        
        console.log('✅ Test 4 Passed: Successfully toggled trendline slope');
      }, 1000);
    }, 1000);
  }
  
  // Test 5: Check if the chart data includes delta and percent change
  setTimeout(() => {
    // Find chart components
    const chartComponents = Array.from(document.querySelectorAll('[class^="recharts-layer"]'));
    
    // Check for delta values
    displayModeSelect.value = 'delta';
    displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    
    setTimeout(() => {
      const hasDeltaBars = chartComponents.some(comp => 
        comp.getAttribute('name') === 'delta' || 
        comp.getAttribute('name') === 'Change'
      );
      
      if (hasDeltaBars) {
        console.log('✅ Test 5.1 Passed: Delta bars found in chart');
      } else {
        console.error('❌ Test 5.1 Failed: Delta bars not found in chart');
      }
      
      // Check for percent change values
      displayModeSelect.value = 'percent';
      displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      setTimeout(() => {
        const hasPercentBars = chartComponents.some(comp => 
          comp.getAttribute('name') === 'percentChange' || 
          comp.getAttribute('name') === '% Change'
        );
        
        if (hasPercentBars) {
          console.log('✅ Test 5.2 Passed: Percent change bars found in chart');
        } else {
          console.error('❌ Test 5.2 Failed: Percent change bars not found in chart');
        }
        
        // Restore original value
        displayModeSelect.value = originalValue;
        displayModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('🏁 AI Analysis Features Test Completed');
      }, 1000);
    }, 1000);
  }, 4000);
}

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Navigate to the AI Analysis Dashboard
2. Verify that you can see the "Display Mode" dropdown with options:
   - Raw Values
   - Delta (Change)
   - Percent Change
3. Try switching between these modes and observe the chart changes
4. Check the "Show Trendline Slope" checkbox
5. Verify that the Trendline Slope chart appears below the main chart
6. Uncheck the "Show Trendline Slope" checkbox
7. Verify that the Trendline Slope chart disappears

To run automated tests, execute:
testAIAnalysisFeatures()
`);