const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = "AIzaSyDfR81fvkuHDEdYf6X6oAyKUJ7pkM-quak";
const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-001',
  'gemini-2.5-pro',
];

async function testModels() {
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello, are you there?");
      console.log(`✅ SUCCESS: ${modelName}`);
      console.log(`Response: ${result.response.text()}`);
      return; // Stop at first successful
    } catch (e) {
      console.log(`❌ FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
    }
  }
}

testModels();
