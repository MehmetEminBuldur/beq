// Test script to verify quanta creation functionality
// Run this in the browser console on the chat page to test AI quanta creation

async function testQuantaCreation() {
  console.log('Testing AI quanta creation...');
  
  // Test 1: Check if we can create a brick first
  console.log('Step 1: Testing brick creation...');
  
  // Test 2: Check database schema
  console.log('Step 2: Checking if we can fetch existing bricks...');
  
  try {
    const response = await fetch('/api/bricks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const bricks = await response.json();
      console.log('✅ Bricks API working. Found bricks:', bricks.length);
      
      if (bricks.length > 0) {
        console.log('Sample brick:', bricks[0]);
        
        // Test 3: Try to create a quanta for the first brick
        console.log('Step 3: Testing quanta creation for brick:', bricks[0].id);
        
        const quantaResponse = await fetch('/api/quantas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brick_id: bricks[0].id,
            title: 'Test Quanta',
            description: 'This is a test quanta created by the test script',
            estimated_duration_minutes: 30
          })
        });
        
        if (quantaResponse.ok) {
          const newQuanta = await quantaResponse.json();
          console.log('✅ Quanta creation successful:', newQuanta);
        } else {
          const error = await quantaResponse.text();
          console.error('❌ Quanta creation failed:', error);
        }
      } else {
        console.log('No bricks found. Create a brick first through the AI chat.');
      }
    } else {
      console.error('❌ Bricks API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testQuantaCreation();
