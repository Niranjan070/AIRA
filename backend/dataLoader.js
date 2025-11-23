// Data Loader for TATA Datasets
// Loads CSV and JSON datasets to provide context to Gemini agents

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataLoader {
  constructor() {
    this.dataCache = {};
    this.datasetsPath = path.join(__dirname, 'datasets');
  }

  // Load CSV file and parse it
  loadCSV(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < Math.min(lines.length, 101); i++) { // Limit to 100 rows for prompt size
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        data.push(row);
      }
      
      return data;
    } catch (error) {
      console.error(`Error loading CSV ${filePath}:`, error.message);
      return [];
    }
  }

  // Load JSON file
  loadJSON(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // If it's an array, limit to first 50 items for prompt size
      if (Array.isArray(data)) {
        return data.slice(0, 50);
      }
      
      return data;
    } catch (error) {
      console.error(`Error loading JSON ${filePath}:`, error.message);
      return null;
    }
  }

  // Load all financial datasets
  loadFinancialData() {
    if (this.dataCache.financial) {
      return this.dataCache.financial;
    }

    const financialPath = path.join(this.datasetsPath, 'financial');
    const data = {
      aggregate_expenditure: this.loadCSV(path.join(financialPath, 'Aggregate_Expenditure.csv')),
      capital_expenditure: this.loadCSV(path.join(financialPath, 'Capital_Expenditure.csv')),
      fiscal_deficits: this.loadCSV(path.join(financialPath, 'Gross_Fiscal_Deficits.csv')),
      gsdp: this.loadCSV(path.join(financialPath, 'Nominal_GSDP_Series.csv')),
      tax_revenues: this.loadCSV(path.join(financialPath, 'Own_Tax_Revenues.csv')),
      revenue_deficits: this.loadCSV(path.join(financialPath, 'Revenue_Deficits.csv')),
      revenue_expenditure: this.loadCSV(path.join(financialPath, 'Revenue_Expenditure.csv'))
    };

    this.dataCache.financial = data;
    return data;
  }

  // Load legal dataset
  loadLegalData() {
    if (this.dataCache.legal) {
      return this.dataCache.legal;
    }

    const legalPath = path.join(this.datasetsPath, 'legal');
    const data = this.loadJSON(path.join(legalPath, 'IndicLegalQA Dataset_10K_Revised.json'));

    this.dataCache.legal = data;
    return data;
  }

  // Load market dataset
  loadMarketData() {
    if (this.dataCache.market) {
      return this.dataCache.market;
    }

    const marketPath = path.join(this.datasetsPath, 'market');
    const data = {
      tata_global: this.loadCSV(path.join(marketPath, 'NSE-TATAGLOBAL11.csv'))
    };

    this.dataCache.market = data;
    return data;
  }

  // Load social dataset
  loadSocialData() {
    if (this.dataCache.social) {
      return this.dataCache.social;
    }

    const socialPath = path.join(this.datasetsPath, 'social');
    const data = {
      social_expenditure: this.loadCSV(path.join(socialPath, 'Social_Sector_Expenditure.csv'))
    };

    this.dataCache.social = data;
    return data;
  }

  // Format financial data for prompt
  formatFinancialDataForPrompt() {
    const data = this.loadFinancialData();
    
    return `
FINANCIAL DATASETS AVAILABLE:

1. AGGREGATE EXPENDITURE DATA (Sample):
${JSON.stringify(data.aggregate_expenditure.slice(0, 5), null, 2)}
Total records: ${data.aggregate_expenditure.length}

2. CAPITAL EXPENDITURE DATA (Sample):
${JSON.stringify(data.capital_expenditure.slice(0, 5), null, 2)}
Total records: ${data.capital_expenditure.length}

3. FISCAL DEFICITS DATA (Sample):
${JSON.stringify(data.fiscal_deficits.slice(0, 5), null, 2)}
Total records: ${data.fiscal_deficits.length}

4. GSDP DATA (Sample):
${JSON.stringify(data.gsdp.slice(0, 5), null, 2)}
Total records: ${data.gsdp.length}

5. TAX REVENUES DATA (Sample):
${JSON.stringify(data.tax_revenues.slice(0, 5), null, 2)}
Total records: ${data.tax_revenues.length}

Use this real financial data from government sources in your analysis.
`;
  }

  // Format legal data for prompt
  formatLegalDataForPrompt() {
    const data = this.loadLegalData();
    
    if (!data || data.length === 0) {
      return '\nNo legal data available.';
    }

    return `
LEGAL DATASET AVAILABLE:

INDIAN LEGAL Q&A DATABASE (Sample):
${JSON.stringify(data.slice(0, 3), null, 2)}
Total records: ${data.length}

Use this legal precedent data for Indian regulatory and compliance analysis.
`;
  }

  // Format market data for prompt
  formatMarketDataForPrompt() {
    const data = this.loadMarketData();
    
    return `
MARKET DATASETS AVAILABLE:

TATA GLOBAL STOCK DATA (NSE, Sample):
${JSON.stringify(data.tata_global.slice(0, 10), null, 2)}
Total records: ${data.tata_global.length}

Use this real TATA Global market data for market analysis and trends.
`;
  }

  // Format social data for prompt
  formatSocialDataForPrompt() {
    const data = this.loadSocialData();
    
    return `
SOCIAL DATASETS AVAILABLE:

SOCIAL SECTOR EXPENDITURE DATA (Sample):
${JSON.stringify(data.social_expenditure.slice(0, 5), null, 2)}
Total records: ${data.social_expenditure.length}

Use this social expenditure data for impact and CSR analysis.
`;
  }

  // Get summary statistics
  getDatasetSummary() {
    return {
      financial: {
        available: true,
        datasets: 7,
        total_records: Object.values(this.loadFinancialData()).reduce((sum, arr) => sum + arr.length, 0)
      },
      legal: {
        available: true,
        datasets: 1,
        total_records: this.loadLegalData()?.length || 0
      },
      market: {
        available: true,
        datasets: 1,
        total_records: this.loadMarketData().tata_global.length
      },
      social: {
        available: true,
        datasets: 1,
        total_records: this.loadSocialData().social_expenditure.length
      }
    };
  }
}

export default new DataLoader();
