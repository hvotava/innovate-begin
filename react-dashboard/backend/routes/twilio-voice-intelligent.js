// INTELLIGENT Voice/call handler with lesson selection
const { getLessonForUser } = require('./lesson-selector');
const { ConversationManager } = require('./ai-conversation');

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
        timeout="10"
        maxLength="30"
        playBeep="true"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
        transcribeCallbackMethod="POST"
        language="cs-CZ"
    />
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Děkuji za odpověď. Pokračujeme další otázkou.
    </Say>
</Response>`;
    } else if (lessonData.type === 'lesson') {
      // Format first question properly (could be object with multiple choice)
      let firstQuestion = lessonData.questions[0];
      
      console.log(`🎯 First question structure:`, firstQuestion);
      
      if (typeof firstQuestion === 'object' && firstQuestion.question) {
        // This is a test question with multiple choice
        let questionText = firstQuestion.question;
        
        if (firstQuestion.options && firstQuestion.options.length > 0) {
          questionText += " Možnosti: ";
          firstQuestion.options.forEach((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            // Handle both string options and object options
            const optionText = typeof option === 'string' ? option : (option.text || option);
            questionText += `${letter}: ${optionText}. `;
          });
        }
        
        firstQuestion = questionText;
      }
      
      console.log(`🎯 Formatted first question:`, firstQuestion);
      
      // Regular lesson TwiML
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        ${lessonData.message}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        První otázka: ${firstQuestion}
    </Say>
    <Say language="cs-CZ" rate="0.7" voice="Google.cs-CZ-Standard-A">
        Po pípnutí řekněte svoji odpověď česky nahlas a jasně. Řekněte písmeno A, B, C nebo D. Stiskněte mřížku když dokončíte.
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
        language="cs-CZ"
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
