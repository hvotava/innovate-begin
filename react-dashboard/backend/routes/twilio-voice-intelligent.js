// INTELLIGENT Voice/call handler with lesson selection
const { getLessonForUser, getLocalizedInstructions } = require('./lesson-selector');
const { VoiceNavigationManager } = require('./voice-navigation');

async function intelligentVoiceCall(req, res) {
  console.log('🧠 INTELLIGENT Voice/call handler CALLED');
  console.log('🔥 DEPLOYMENT VERSION: 2025-08-06-19:06 - FORCE DATABASE QUESTIONS!');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  const userPhone = req.body.To; // The user's phone number being called
  const callSid = req.body.CallSid; // Twilio Call SID for this call
  console.log(`📱 DEBUG: Finding lesson for user phone: ${userPhone}, CallSid: ${callSid}`);
  
  try {
    console.log(`🔍 DEBUG: Starting getLessonForUser for phone: ${userPhone}`);
    
    // Get appropriate lesson/test for this user
    const lessonData = await getLessonForUser(userPhone);
    console.log('🎯 DEBUG: Lesson data received:', JSON.stringify(lessonData, null, 2));
    
    // Get user's language for Twilio configuration
    const userLanguage = lessonData.language || 'cs';
    console.log('🌍 Using language for Twilio:', userLanguage);
    
    // Initialize VoiceNavigationManager with lesson data
    if (lessonData.type === 'lesson' && callSid) {
      VoiceNavigationManager.initializeState(callSid, lessonData);
      console.log('✅ VoiceNavigationManager initialized for lesson:', lessonData.title);
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
        timeout="10"
        maxLength="30"
        playBeep="true"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(userLanguage)}"
        trim="trim-silence"
    />
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.9" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${getLocalizedThankYou(userLanguage)}
    </Say>
</Response>`;
    } else if (lessonData.type === 'lesson') {
      // Format lesson content for TwiML
      let lessonContent = lessonData.content || lessonData.description || 'Praktické školení.';
      if (lessonData.title) {
        lessonContent = `${lessonData.title}. ${lessonContent}`;
      }
      
      console.log(`🎯 Lesson content:`, lessonContent);
      
      // Regular lesson TwiML (lesson only, no test mention)
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.9" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${lessonData.message}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.85" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${lessonContent}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Řekněte cokoliv pro pokračování.
    </Say>
    <Record finishOnKey="#" 
        timeout="20"
        maxLength="90"
        playBeep="true"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(userLanguage)}"
        trim="trim-silence"
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

// Language helper functions
function getTwilioLanguage(language) {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'de':
      return 'de-DE';
    case 'sk':
      return 'sk-SK';
    default: // cs
      return 'cs-CZ';
  }
}

function getLocalizedThankYou(language) {
  switch (language) {
    case 'en':
      return 'Thank you for your answer. We continue with the next question.';
    case 'de':
      return 'Danke für Ihre Antwort. Wir fahren mit der nächsten Frage fort.';
    case 'sk':
      return 'Ďakujeme za vašu odpoveď. Pokračujeme ďalšou otázkou.';
    default: // cs
      return 'Děkuji za odpověď. Pokračujeme další otázkou.';
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
