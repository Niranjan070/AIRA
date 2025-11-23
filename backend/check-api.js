// Direct API call to list models
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModelsDirectAPI() {
  try {
    console.log('🔍 Calling Google AI API directly to list models...\n');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Available Models:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`📋 Model: ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
      
      // Find text generation models
      console.log('\n💡 Models supporting generateContent:');
      const textModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      textModels.forEach(m => console.log(`   ✅ ${m.name}`));
      
    } else {
      console.log('No models found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModelsDirectAPI();
