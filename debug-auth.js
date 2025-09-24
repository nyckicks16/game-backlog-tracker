// Debug script to test authentication flow
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('Testing authentication flow...');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);
    
    // Test 2: Auth status (should be unauthenticated)
    console.log('2. Testing auth status...');
    try {
      const status = await axios.get(`${API_BASE_URL}/auth/status`);
      console.log('✅ Auth status:', status.data);
    } catch (error) {
      console.log('❌ Auth status failed:', error.response?.data || error.message);
    }
    
    // Test 3: Try /auth/me without token (should fail)
    console.log('3. Testing /auth/me without token...');
    try {
      const me = await axios.get(`${API_BASE_URL}/auth/me`);
      console.log('❌ Unexpected success:', me.data);
    } catch (error) {
      console.log('✅ Expected failure (no token):', error.response?.status);
    }
    
    // Test 4: Try /auth/me with invalid token (should fail)
    console.log('4. Testing /auth/me with invalid token...');
    try {
      const me = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Unexpected success:', me.data);
    } catch (error) {
      console.log('✅ Expected failure (invalid token):', error.response?.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuthFlow().catch(console.error);