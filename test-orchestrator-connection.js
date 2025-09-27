// Test script to verify orchestrator service connection
// Run this in the browser console to test the orchestrator

async function testOrchestratorConnection() {
  console.log('Testing orchestrator connection...');
  
  const orchestratorUrl = 'http://localhost:8000'; // Default orchestrator URL
  
  try {
    // Test 1: Check if orchestrator is running
    console.log('Step 1: Checking orchestrator health...');
    const healthResponse = await fetch(`${orchestratorUrl}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Orchestrator is running:', healthData);
    } else {
      console.error('❌ Orchestrator health check failed:', healthResponse.status);
      return;
    }
    
    // Test 2: Test chat endpoint directly
    console.log('Step 2: Testing chat endpoint...');
    
    // Get current user ID (you'll need to replace this with actual user ID)
    const userId = 'your-user-id-here'; // Replace with actual user ID
    
    const chatResponse = await fetch(`${orchestratorUrl}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Create a brick for learning JavaScript',
        user_id: userId,
        conversation_id: crypto.randomUUID()
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat endpoint working:', chatData);
      
      if (chatData.bricks_created && chatData.bricks_created.length > 0) {
        console.log('✅ Brick creation successful:', chatData.bricks_created);
      } else {
        console.log('⚠️ No bricks were created in the response');
      }
    } else {
      const error = await chatResponse.text();
      console.error('❌ Chat endpoint failed:', chatResponse.status, error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('💡 Make sure the orchestrator service is running on port 8000');
    console.log('💡 You can start it with: cd services/orchestrator && python -m uvicorn app.main:app --reload --port 8000');
  }
}

// Instructions for the user
console.log('🔧 To test orchestrator connection:');
console.log('1. Make sure orchestrator service is running');
console.log('2. Replace "your-user-id-here" with your actual user ID');
console.log('3. Run: testOrchestratorConnection()');

// Uncomment the line below to run the test automatically
// testOrchestratorConnection();
