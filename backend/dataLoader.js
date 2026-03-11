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

  // Helper: extract compact summary from a state-year financial dataset
  _summarizeFinancialDataset(rows, datasetName) {
    if (!rows || rows.length === 0) return `${datasetName}: No data available`;
    
    // Get year columns (all keys except 'State')
    const yearCols = Object.keys(rows[0]).filter(k => k !== 'State');
    const latestYear = yearCols[yearCols.length - 1];
    const prevYear = yearCols.length > 1 ? yearCols[yearCols.length - 2] : null;
    
    // Get top 5 states by latest year value
    const parsed = rows
      .map(r => ({ state: (r.State || '').trim(), value: parseFloat(String(r[latestYear]).replace(/,/g, '')) }))
      .filter(r => !isNaN(r.value) && r.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const top5 = parsed.slice(0, 5);
    const total = parsed.reduce((s, r) => s + r.value, 0);
    
    let summary = `${datasetName} (${rows.length} states, ${yearCols[0]} to ${latestYear}):\n`;
    summary += `  National Total (${latestYear}): ₹${Math.round(total).toLocaleString('en-IN')} crore\n`;
    summary += `  Top 5 states: ${top5.map(s => `${s.state}: ₹${Math.round(s.value).toLocaleString('en-IN')}`).join(', ')}\n`;
    
    return summary;
  }

  // Format financial data for prompt — compact summary instead of raw JSON
  formatFinancialDataForPrompt() {
    const data = this.loadFinancialData();
    
    return `
INDIAN GOVERNMENT FINANCIAL DATA (Source: Reserve Bank of India):

${this._summarizeFinancialDataset(data.aggregate_expenditure, 'Aggregate Expenditure')}
${this._summarizeFinancialDataset(data.capital_expenditure, 'Capital Expenditure')}
${this._summarizeFinancialDataset(data.fiscal_deficits, 'Gross Fiscal Deficits')}
${this._summarizeFinancialDataset(data.gsdp, 'Nominal GSDP')}
${this._summarizeFinancialDataset(data.tax_revenues, 'Own Tax Revenues')}

Use these Indian government financial statistics in your analysis.
`;
  }

  // Format legal data for prompt
  formatLegalDataForPrompt() {
    const data = this.loadLegalData();
    
    if (!data || data.length === 0) {
      return '\nNo legal data available.';
    }

    // Send only 2 compact samples
    const samples = data.slice(0, 2).map(item => {
      // Truncate long text fields to keep prompt compact
      const compact = {};
      for (const [key, value] of Object.entries(item)) {
        compact[key] = typeof value === 'string' && value.length > 150 
          ? value.substring(0, 150) + '...' 
          : value;
      }
      return compact;
    });

    return `
INDIAN LEGAL Q&A DATABASE (${data.length} legal precedents, Source: IndicLegal):
${JSON.stringify(samples, null, 2)}

Use this legal precedent data for Indian regulatory and compliance analysis.
`;
  }

  // Format market data for prompt
  formatMarketDataForPrompt() {
    const data = this.loadMarketData();
    const rows = data.tata_global;
    
    // Send compact summary instead of full rows
    const latest = rows.slice(0, 3);
    const oldest = rows.slice(-1);
    
    return `
TATA GLOBAL STOCK DATA (NSE, ${rows.length} trading days):
Recent prices: ${JSON.stringify(latest)}
Historical: ${JSON.stringify(oldest)}

Use this TATA Global market data for market analysis and trends.
`;
  }

  // Format social data for prompt — compact summary
  formatSocialDataForPrompt() {
    const data = this.loadSocialData();
    
    return `
SOCIAL SECTOR EXPENDITURE (${data.social_expenditure.length} states, Source: RBI/Government):
${this._summarizeFinancialDataset(data.social_expenditure, 'Social Sector Expenditure')}

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
