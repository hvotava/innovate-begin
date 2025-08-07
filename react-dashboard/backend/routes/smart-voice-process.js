const { ConversationManager } = require('./ai-conversation');
const { getLessonForUser } = require('./lesson-selector');
// const { TestResponse } = require('../models');
// const { AIEvaluator } = require('../services/ai-evaluator');
const { v4: uuidv4 } = require('uuid');

// Track call initialization
const initializedCalls = new Set();

// Smart voice processing with lesson->test conversation flow  
async function smartVoiceProcess(req, res) {
  console.log('🎙️ Voice processing called');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 DEBUG: RecordingUrl exists?', !!req.body.RecordingUrl);
  console.log('🔍 DEBUG: CallSid:', req.body.CallSid);
  console.log('🔍 DEBUG: TranscriptionStatus:', req.body.TranscriptionStatus);
  
  const { RecordingUrl, CallSid, RecordingDuration, Called, Caller } = req.body;
  
  // Initialize conversation on first call
  if (!initializedCalls.has(CallSid)) {
    console.log(`🚀 Initializing conversation for call: ${CallSid}`);
    
    try {
      // Get lesson for user based on phone number
      const userPhone = Called || Caller;
      const lesson = await getLessonForUser(userPhone);
      
      if (lesson && lesson.type === 'lesson') {
        // Initialize conversation manager
        ConversationManager.initializeState(CallSid, lesson);
        initializedCalls.add(CallSid);
        console.log(`✅ Conversation initialized for lesson: ${lesson.title}`);
      } else {
        console.log(`❌ Could not initialize lesson for phone: ${userPhone}`);
        return res.send(getErrorTwiml());
      }
    } catch (error) {
      console.error('❌ Error initializing conversation:', error.message);
      return res.send(getErrorTwiml());
    }
  }
  
  // Check if we have a recording URL (user response)
  if (!RecordingUrl) {
    console.log('❌ No recording URL provided - waiting for user response');
    console.log('🔍 DEBUG: This should not happen during normal flow');
    return res.send(getContinueTwiml());
  }
  
  console.log('✅ RecordingUrl found, proceeding with transcription callback');
  
  // FALLBACK: If transcription callback doesn't work, process directly
  console.log('🔍 DEBUG: TranscriptionStatus is undefined, trying fallback processing');
  console.log('🔍 DEBUG: Full request body for transcription analysis:', {
    RecordingUrl: !!RecordingUrl,
    TranscriptionStatus: req.body.TranscriptionStatus,
    TranscriptionText: req.body.TranscriptionText,
    hasTranscriptionText: !!req.body.TranscriptionText
  });
  
  try {
    // Try to process the recording directly since transcription callback might not work
    console.log('🔄 FALLBACK: Processing recording without transcription callback');
    
    // Get conversation state
    const state = ConversationManager.getState(CallSid);
    if (!state) {
      console.log('❌ No conversation state found in fallback');
      return res.send(getErrorTwiml());
    }
    
    console.log('✅ Conversation state found in fallback, processing with fallback text');
    
    // Process with fallback text (since we don't have transcription)
    const response = await ConversationManager.processUserResponse(
      '[Fallback odpověď - transcription nefunguje]',
      CallSid,
      Called || Caller
    );
    
    console.log('🧠 Fallback conversation response:', response);
    
    // Generate TwiML response
    let twimlResponse = '';
    if (response.questionType === 'session_complete') {
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Hangup/>
</Response>`;
    } else if (response.nextQuestion) {
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="cs-CZ" rate="0.7" voice="Google.cs-CZ-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="10"
        maxLength="30"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;
    } else {
      twimlResponse = getErrorTwiml();
    }
    
    console.log('📤 Sending fallback TwiML response...');
    res.set('Content-Type', 'application/xml');
    res.send(twimlResponse);
    console.log('✅ Fallback TwiML response sent');
    return; // ← PŘIDÁM RETURN ABY SE NEPOKRAČOVALO!
    
  } catch (error) {
    console.error('❌ Error in fallback processing:', error.message);
    res.set('Content-Type', 'application/xml');
    res.send(getErrorTwiml());
    return; // ← PŘIDÁM RETURN ABY SE NEPOKRAČOVALO!
  }
  
  // This code should never be reached if fallback works
  console.log('⚠️ Fallback did not work, using default processing');
  console.log(`🎵 RecordingUrl: ${RecordingUrl}`);
  
  // Send basic continuation TwiML (transcription will handle the logic)
  const processTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Děkuji za odpověď. Zpracovávám...
    </Say>
    <Record 
        timeout="10"
        maxLength="30"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;

  console.log('✅ Process TwiML response sent');
  res.set('Content-Type', 'application/xml');
  res.send(processTwiml);
}

// Enhanced transcription processor with lesson->test flow
async function smartTranscribeProcess(req, res) {
  console.log('🎯 SMART Transcription processing STARTED');
  console.log('🎯 CallSid:', req.body.CallSid);
  console.log('📄 TranscriptionText:', req.body.TranscriptionText);
  console.log('📊 TranscriptionStatus:', req.body.TranscriptionStatus);
  console.log('🔍 DEBUG: Full transcription request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 DEBUG: Transcription callback analysis:', {
    hasCallSid: !!req.body.CallSid,
    hasTranscriptionText: !!req.body.TranscriptionText,
    hasTranscriptionStatus: !!req.body.TranscriptionStatus,
    transcriptionStatus: req.body.TranscriptionStatus,
    transcriptionTextLength: req.body.TranscriptionText ? req.body.TranscriptionText.length : 0
  });
  
  const transcribedText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  
  if (req.body.TranscriptionStatus === 'completed' && transcribedText) {
    console.log(`💬 User said: "${transcribedText}"`);
    console.log('✅ Transcription completed successfully, processing with ConversationManager...');
    
    try {
      // Process with new ConversationManager
      console.log('🧠 Calling ConversationManager.processUserResponse...');
      const response = await ConversationManager.processUserResponse(
        transcribedText, 
        callSid,
        req.body.Called || req.body.Caller
      );
      
      console.log('🧠 Conversation Analysis:', response);
      console.log('🔍 DEBUG: Response structure:', {
        questionType: response.questionType,
        hasNextQuestion: !!response.nextQuestion,
        hasFeedback: !!response.feedback,
        hasTestResults: !!response.testResults
      });
      
      // Generate TwiML response based on conversation state
      let twimlResponse = '';
      
      if (response.questionType === 'session_complete') {
        // Test completed - end call
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Hangup/>
</Response>`;
      } else if (response.nextQuestion) {
        // Continue with next question
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="cs-CZ" rate="0.7" voice="Google.cs-CZ-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="10"
        maxLength="30"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;
      } else {
        // Error or unknown state
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback || 'Omlouvám se, došlo k chybě.'}
    </Say>
    <Hangup/>
</Response>`;
      }
      
      // Send TwiML response
      console.log('📤 Sending TwiML response to Twilio...');
      console.log('🔍 DEBUG: TwiML response length:', twimlResponse.length);
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
      console.log('✅ TwiML response sent successfully');
      
      // Save test results when test is completed
      if (response.testResults) {
        console.log('📊 Test Results:', {
          score: `${response.testResults.score}/${response.testResults.total}`,
          percentage: `${response.testResults.percentage}%`
        });
        
        console.log('✅ Test results have been saved to database by ConversationManager');
      }
      
    } catch (error) {
      console.error('❌ Transcription processing error:', error.message);
      console.error('📋 Error details:', error.stack);
      
      // Send error TwiML
      res.set('Content-Type', 'application/xml');
      res.send(getErrorTwiml());
    }
  } else if (req.body.TranscriptionStatus === 'failed') {
    console.log('❌ Transcription failed, but continuing with conversation');
    console.log('📋 Recording URL:', req.body.RecordingUrl);
    console.log('🔍 DEBUG: Transcription failed, using fallback text');
    
    try {
      // Continue conversation even with failed transcription
      const response = await ConversationManager.processUserResponse(
        '[Nerozpoznaná odpověď]', // Fallback text
        callSid,
        req.body.Called || req.body.Caller
      );
      
      console.log('🧠 Conversation continued despite transcription failure:', response);
      
      // Generate TwiML for failed transcription case
      let twimlResponse = '';
      if (response.questionType === 'session_complete') {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Hangup/>
</Response>`;
      } else if (response.nextQuestion) {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="cs-CZ" rate="0.7" voice="Google.cs-CZ-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="10"
        maxLength="30"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;
      } else {
        twimlResponse = getErrorTwiml();
      }
      
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
    } catch (error) {
      console.error('❌ Error handling failed transcription:', error.message);
      res.set('Content-Type', 'application/xml');
      res.send(getErrorTwiml());
    }
  } else {
    console.log('⚠️ No transcription text available:', {
      status: req.body.TranscriptionStatus,
      text: transcribedText,
      hasText: !!transcribedText
    });
    console.log('🔍 DEBUG: This should not happen - transcription callback without text');
    
    // Send continue TwiML for no transcription case
    res.set('Content-Type', 'application/xml');
    res.send(getContinueTwiml());
  }
  
  console.log('🎯 SMART Transcription processing ENDED');
}

// Helper TwiML functions
function getErrorTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Omlouvám se, došlo k chybě při načítání lekce. Zkuste to prosím později.
    </Say>
    <Hangup/>
</Response>`;
}

function getContinueTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Poslechněte si otázku a odpovězte.
    </Say>
    <Record 
        timeout="3"
        maxLength="30"
        playBeep="false"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    />
</Response>`;
}

module.exports = { smartVoiceProcess, smartTranscribeProcess };
