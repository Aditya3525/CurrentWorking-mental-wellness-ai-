#!/usr/bin/env node

/**
 * AI Provider Test Script
 * Tests all configured AI providers and reports their status
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAIProviders() {
  console.log('🧠 AI Provider Test Suite');
  console.log('========================\n');

  try {
    // Import LLM service from compiled version
    const { llmService } = await import('./dist/services/llmProvider.js');
    
    console.log('1. Testing Provider Status...');
    const status = await llmService.getProviderStatus();
    console.log('Provider Status:', JSON.stringify(status, null, 2));
    
    console.log('\n2. Testing Provider Connectivity...');
    const testResults = await llmService.testAllProviders();
    console.log('Test Results:', JSON.stringify(testResults, null, 2));
    
    console.log('\n3. Testing AI Response Generation...');
    
    // Test user context
    const testUserContext = {
      id: 'test-user',
      name: 'Test User',
      approach: 'western',
      preferences: {}
    };
    
    const testConversation = {
      user: testUserContext,
      messages: [{ role: 'user', content: 'I am feeling anxious about an upcoming presentation.' }],
      sessionId: 'test-session',
      timestamp: new Date()
    };

    const response = await llmService.generateResponse(
      [{ role: 'user', content: 'I am feeling anxious about an upcoming presentation.' }],
      { maxTokens: 100, temperature: 0.7 },
      testConversation
    );
    
    console.log('AI Response Test:');
    console.log('- Provider:', response.provider);
    console.log('- Model:', response.model);
    console.log('- Response:', response.content);
    console.log('- Processing Time:', response.processingTime + 'ms');
    
    console.log('\n✅ AI Provider Test Complete!');
    
  } catch (error) {
    console.error('❌ AI Provider Test Failed:', error.message);
    console.error('Error Details:', error);
    process.exit(1);
  }
}

async function checkEnvironment() {
  console.log('🔧 Environment Configuration Check');
  console.log('==================================\n');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const optionalEnvVars = [
    'OPENAI_API_KEY_1',
    'ANTHROPIC_API_KEY_1',
    'OLLAMA_BASE_URL',
    'OLLAMA_MODEL'
  ];
  
  console.log('Required Environment Variables:');
  for (const envVar of requiredEnvVars) {
    const status = process.env[envVar] ? '✅' : '❌';
    console.log(`${status} ${envVar}: ${process.env[envVar] ? 'Set' : 'Not Set'}`);
  }
  
  console.log('\nOptional AI Provider Variables:');
  for (const envVar of optionalEnvVars) {
    const status = process.env[envVar] ? '✅' : '⚠️';
    console.log(`${status} ${envVar}: ${process.env[envVar] ? 'Set' : 'Not Set'}`);
  }
  
  console.log('\n');
}

async function checkOllama() {
  console.log('🦙 Ollama Connectivity Check');
  console.log('============================\n');
  
  try {
    const axios = require('axios');
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    // Check if Ollama is running
    const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
    console.log('✅ Ollama is running');
    console.log('Available models:', response.data.models?.map(m => m.name) || []);
    
    // Check if required model is available
    const requiredModel = process.env.OLLAMA_MODEL || 'llama3';
    const hasModel = response.data.models?.some(m => m.name.includes(requiredModel));
    
    if (hasModel) {
      console.log(`✅ Required model '${requiredModel}' is available`);
    } else {
      console.log(`⚠️ Required model '${requiredModel}' not found`);
      console.log(`Run: ollama pull ${requiredModel}`);
    }
    
  } catch (error) {
    console.log('❌ Ollama is not running or not accessible');
    console.log('Install Ollama from: https://ollama.ai');
    console.log('Start Ollama and run: ollama pull llama3');
  }
  
  console.log('\n');
}

async function main() {
  console.log('🧪 Mental Wellbeing AI - Provider Test Suite\n');
  
  await checkEnvironment();
  await checkOllama();
  await testAIProviders();
  
  console.log('🎉 Test suite completed!');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testAIProviders, checkEnvironment, checkOllama };
