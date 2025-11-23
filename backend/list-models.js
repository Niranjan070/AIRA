// Script to list available Gemini models
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('🔍 Fetching available Gemini models...\n');
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('✅ Available Models:\n');
    for await (const model of models) {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    
    // Try common model names
    console.log('\n🧪 Testing common model names...\n');
    
    const testModels = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'models/gemini-pro',
      'models/gemini-1.5-pro-latest'
    ];
    
    for (const modelName of testModels) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log(`  ✅ ${modelName} - WORKS!`);
      } catch (err) {
        console.log(`  ❌ ${modelName} - ${err.message.split('\n')[0]}`);
      }
    }
  }
}

listModels();
