const axios = require('axios');

const BASE_URL = 'http://localhost:4001';

async function testConnection() {
  console.log('Testing server connection...');
  
  // Test 1: Basic server connection
  try {
    console.log('\n1. Testing basic connection...');
    const response = await axios.get(`${BASE_URL}`);
    console.log('✅ Basic connection successful');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ Basic connection failed');
    console.log(`   Error: ${error.message}`);
    if (error.code) console.log(`   Code: ${error.code}`);
  }

  // Test 2: Test /v1 endpoint
  try {
    console.log('\n2. Testing /v1 endpoint...');
    const response = await axios.get(`${BASE_URL}/v1`);
    console.log('✅ /v1 endpoint accessible');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ /v1 endpoint failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }

  // Test 3: Test health-records endpoint (GET)
  try {
    console.log('\n3. Testing /v1/health-records endpoint (GET)...');
    const response = await axios.get(`${BASE_URL}/v1/health-records`);
    console.log('✅ /v1/health-records GET successful');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('❌ /v1/health-records GET failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }

  // Test 4: Test if POST is accepted (without file)
  try {
    console.log('\n4. Testing /v1/health-records endpoint (POST - minimal)...');
    const response = await axios.post(`${BASE_URL}/v1/health-records`, {
      test: 'connection'
    });
    console.log('✅ /v1/health-records POST accepted');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    console.log('ℹ️  /v1/health-records POST responded (expected)');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

testConnection();