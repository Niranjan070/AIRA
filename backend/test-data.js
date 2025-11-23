// Test script for dataLoader
import dataLoader from './dataLoader.js';

console.log('Testing Data Loader...\n');

try {
  console.log('1. Getting dataset summary...');
  const summary = dataLoader.getDatasetSummary();
  console.log(JSON.stringify(summary, null, 2));
  
  console.log('\n2. Loading financial data sample...');
  const financialPrompt = dataLoader.formatFinancialDataForPrompt();
  console.log(financialPrompt.substring(0, 500) + '...');
  
  console.log('\n✅ Data loader working correctly!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}
