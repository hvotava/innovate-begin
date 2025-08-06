// INTELLIGENT Voice/call handler with lesson selection
const { getLessonForUser } = require('./lesson-selector');
const { ConversationManager } = require('./ai-conversation');

async function intelligentVoiceCall(req, res) {
  console.log('🧠 INTELLIGENT Voice/call handler');
  console.log('📝 Request body:', req.body);
  
  const userPhone = req.body.To; // The user's phone number being called
  const callSid = req.body.CallSid; // Twilio Call SID for this call
  console.log(`📱 Finding lesson for user phone: ${userPhone}, CallSid: ${callSid}`);
  
  try {
    // Get appropriate lesson/test for this user
    const lessonData = await getLessonForUser(userPhone);
    console.log('🎯 Lesson data:', lessonData);
    
    // Initialize ConversationManager with lesson data
    if (lessonData.type === 'lesson' && callSid) {
      ConversationManager.initializeState(callSid, lessonData);
      console.log('✅ ConversationManager initialized for lesson:', lessonData.title);
    }
    
    let twimlResponse = '';
    
    if (lessonData.type === 'placement_test') {
      // Placement test TwiML
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        ${lessonData.message}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        První otázka: ${lessonData.questions[0]}
    </Say>
    <Record finishOnKey="#" 
        timeout="3"
        maxLength="30"
        playBeep="false"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Děkuji za odpověď. Pokračujeme další otázkou.
    </Say>
</Response>`;
    } else if (lessonData.type === 'lesson') {
      // Regular lesson TwiML
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        ${lessonData.message}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${lessonData.content}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        Zkusme první otázku: ${lessonData.questions[0]}
    </Say>
    <Record finishOnKey="#" 
        timeout="3"
        maxLength="30"
        playBeep="false"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;
    } else {
      // Error fallback
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        ${lessonData.message}
    </Say>
    <Hangup/>
</Response>`;
    }
    
    console.log('✅ INTELLIGENT TwiML response generated');
    res.set('Content-Type', 'application/xml');
    res.send(twimlResponse);
    
  } catch (error) {
    console.error('❌ Error in intelligent voice call:', error.message);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Omlouvám se, došlo k technické chybě. Zkuste to prosím později.
    </Say>
    <Hangup/>
</Response>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(errorTwiml);
  }
}

module.exports = { intelligentVoiceCall };

// Add instruction helper for users
function addFinishInstruction(twimlResponse) {
  return twimlResponse.replace(
    '</Response>',
    `    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        Stiskněte mřížku když dokončíte svou odpověď.
    </Say>
</Response>`
  );
}
