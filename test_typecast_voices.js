// Test Typecast API to find working voice IDs
import fetch from 'node-fetch';

async function testTypecastAPI() {
  const apiKey = process.env.TYPECAST_API_KEY;
  
  if (!apiKey) {
    console.log('❌ TYPECAST_API_KEY not found');
    return;
  }

  try {
    console.log('🔍 Testing Typecast API...');
    
    // Get voices
    const response = await fetch('https://api.typecast.ai/v1/voices', {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API Error: ${response.status} - ${error}`);
      return;
    }

    const data = await response.json();
    console.log(`✅ Found ${data.voices.length} voices`);
    
    // Filter English voices suitable for rap
    const englishVoices = data.voices
      .filter(v => v.language === 'eng')
      .filter(v => v.gender === 'male' || v.gender === 'female')
      .slice(0, 10); // First 10 voices

    console.log('\n🎤 Available English voices:');
    englishVoices.forEach(voice => {
      console.log(`  ${voice.id} - ${voice.name} (${voice.gender})`);
    });

    // Test one voice
    if (englishVoices.length > 0) {
      const testVoice = englishVoices[0];
      console.log(`\n🧪 Testing voice: ${testVoice.name} (${testVoice.id})`);
      
      const testResponse = await fetch('https://api.typecast.ai/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice_id: testVoice.id,
          text: 'Test rap battle verse',
          model: 'ssfm-v21',
          language: 'eng',
          output: {
            audio_format: 'wav'
          }
        })
      });

      if (testResponse.ok) {
        console.log(`✅ Voice ${testVoice.id} works!`);
        console.log(`   Use this ID: ${testVoice.id}`);
      } else {
        const error = await testResponse.text();
        console.log(`❌ Voice test failed: ${error}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testTypecastAPI();