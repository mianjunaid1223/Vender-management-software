// Test vendor portal authentication flow
async function testVendorAuth() {
  const baseUrl = 'http://localhost:9002';
  
  try {
    console.log('=== Testing Vendor Portal Authentication ===');
    
    // Step 1: Login with PIN
    console.log('\n1. Logging in with PIN...');
    const loginResponse = await fetch(`${baseUrl}/api/vendor/pin-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: 'D5RMUNSV',
        email: 'mianjunaid2312@gmail.com'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login successful:', loginData.success);
    
    if (loginData.token) {
      console.log('Token received:', loginData.token.substring(0, 20) + '...');
      
      // Step 2: Verify token
      console.log('\n2. Verifying token...');
      const verifyResponse = await fetch(`${baseUrl}/api/vendor/pin-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Verify response status:', verifyResponse.status);
      console.log('Token valid:', verifyData.valid);
      
      if (!verifyData.valid) {
        console.log('Verify error:', verifyData.error);
      }
      
      // Step 3: Test dashboard API
      console.log('\n3. Testing dashboard API...');
      const dashboardResponse = await fetch(`${baseUrl}/api/vendor/dashboard/${loginData.vendor.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard response status:', dashboardResponse.status);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard data received:', !!dashboardData.vendor);
      } else {
        const dashboardError = await dashboardResponse.json();
        console.log('Dashboard error:', dashboardError.error);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testVendorAuth();
