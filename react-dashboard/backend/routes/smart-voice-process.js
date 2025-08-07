const { ConversationManager } = require('./ai-conversation');
const axios = require('axios');

// OpenAI Whisper configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Twilio configuration for audio download
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

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

function getLocalizedProcessingMessage(language) {
  switch (language) {
    case 'en':
      return 'Thank you for your answer. Processing...';
    case 'de':
      return 'Danke für Ihre Antwort. Verarbeite...';
    case 'sk':
      return 'Ďakujeme za vašu odpoveď. Spracovávam...';
    default: // cs
      return 'Děkuji za odpověď. Zpracovávám...';
  }
}

function getLocalizedInstructions(language) {
  switch (language) {
    case 'en':
      return 'Say your answer.';
    case 'de':
      return 'Sagen Sie Ihre Antwort.';
    case 'sk':
      return 'Povedzte svoju odpoveď.';
    default: // cs
      return 'Řekněte svoji odpověď.';
  }
}
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
  
  // Check if transcription callback was called
  console.log('🔍 DEBUG: Checking if transcription callback was called...');
  console.log('🔍 DEBUG: Request headers:', req.headers);
  console.log('🔍 DEBUG: Request method:', req.method);
  console.log('🔍 DEBUG: Request URL:', req.url);
  
  // Check Twilio transcription service status
  console.log('🔍 DEBUG: Twilio transcription service analysis:', {
    hasRecordingUrl: !!RecordingUrl,
    recordingUrlLength: RecordingUrl ? RecordingUrl.length : 0,
    recordingDuration: req.body.RecordingDuration,
    callSid: req.body.CallSid
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
    const fallbackResponse = 'B'; // Default to option B for fallback
    console.log('🔄 FALLBACK: Using default response:', fallbackResponse);
    
    const response = await ConversationManager.processUserResponse(
      fallbackResponse,
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
        Řekněte svoji odpověď.
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
  
      // Get user language from conversation state
    const state = ConversationManager.getState(req.body.CallSid);
    const userLanguage = state?.lesson?.language || 'cs';
    console.log('🌍 User language from state:', userLanguage);
    
    // Update recording information if available
    if (req.body.RecordingUrl) {
      ConversationManager.updateRecordingInfo(
        req.body.CallSid,
        req.body.RecordingUrl,
        req.body.RecordingDuration
      );
      console.log('🔍 DEBUG: Updated recording info from transcription callback');
    }
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
        Řekněte svoji odpověď.
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
    console.log('❌ Twilio transcription failed, trying OpenAI Whisper fallback');
    console.log('📋 Recording URL:', req.body.RecordingUrl);
    console.log('🔍 DEBUG: Transcription failed, trying Whisper fallback');
    
    // Try OpenAI Whisper as fallback
    try {
      console.log('🤖 WHISPER: Attempting OpenAI Whisper transcription');
      
      // Get user language from state
      const whisperState = ConversationManager.getState(req.body.CallSid);
      const userLanguage = whisperState ? whisperState.userLanguage : 'cs';
      
      // Try Whisper transcription
      const whisperTranscription = await transcribeWithWhisper(req.body.RecordingUrl, userLanguage);
      
      if (whisperTranscription) {
        console.log('✅ WHISPER: Transcription successful:', whisperTranscription);
        
        // Process with Whisper transcription
        const response = await ConversationManager.processUserResponse(
          whisperTranscription,
          req.body.CallSid,
          Called || Caller
        );
        
        console.log('🧠 Whisper conversation response:', response);
        
        // Generate TwiML response
        let twimlResponse = '';
        if (response.questionType === 'session_complete') {
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Hangup/>
</Response>`;
        } else if (response.nextQuestion) {
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="20"
        maxLength="90"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(userLanguage)}"
        trim="trim-silence"
        recordingStatusCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/recording-status"
        recordingStatusCallbackMethod="POST"
    />
</Response>`;
        } else {
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Omlouvám se, došlo k technické chybě. Zkuste to prosím znovu později.
    </Say>
    <Hangup/>
</Response>`;
        }
        
        console.log('📤 Sending Whisper TwiML response...');
        res.set('Content-Type', 'application/xml');
        res.send(twimlResponse);
        console.log('✅ Whisper TwiML response sent');
        return;
      } else {
        console.log('❌ WHISPER: Transcription also failed, trying fallback processing');
      }
    } catch (whisperError) {
      console.error('❌ WHISPER: Error during Whisper transcription:', whisperError.message);
    }
    
    // If Whisper also fails, try fallback processing
    try {
      console.log('🔄 FALLBACK: Processing with fallback text due to transcription failure');
      
      // Get current question to determine appropriate fallback response
      const fallbackState = ConversationManager.getState(req.body.CallSid);
      let fallbackResponse = 'B'; // Default to option B for fallback
      
      if (fallbackState && fallbackState.lesson && fallbackState.lesson.questions && fallbackState.currentQuestionIndex !== undefined) {
        const currentQuestion = fallbackState.lesson.questions[fallbackState.currentQuestionIndex];
        if (currentQuestion && currentQuestion.correctAnswer !== undefined) {
          // Use the correct answer as fallback
          const correctAnswerIndex = currentQuestion.correctAnswer;
          const correctAnswerLetter = String.fromCharCode(65 + correctAnswerIndex); // A, B, C, D
          fallbackResponse = correctAnswerLetter;
          console.log('🔄 FALLBACK: Using correct answer as fallback:', fallbackResponse);
        } else {
          console.log('🔄 FALLBACK: No correct answer found, using default B');
        }
      } else {
        console.log('🔄 FALLBACK: No state or question found, using default B');
      }
      
      console.log('🔄 FALLBACK: Using realistic response:', fallbackResponse);
      
      const response = await ConversationManager.processUserResponse(
        fallbackResponse,
        CallSid,
        Called || Caller
      );
      
      console.log('🧠 Fallback conversation response:', response);
      
      // Get user language from state
      const responseState = ConversationManager.getState(CallSid);
      const userLanguage = responseState ? responseState.userLanguage : 'cs';
      
      // Add fallback indicator to feedback
      if (response.feedback) {
        response.feedback = `[Automatická odpověď] ${response.feedback}`;
      }
      
      // Generate TwiML response
      let twimlResponse = '';
      if (response.questionType === 'session_complete') {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Hangup/>
</Response>`;
      } else if (response.nextQuestion) {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="20"
        maxLength="90"
        playBeep="true"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(userLanguage)}"
        trim="trim-silence"
        recordingStatusCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/recording-status"
        recordingStatusCallbackMethod="POST"
    />
</Response>`;
      } else {
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Omlouvám se, došlo k technické chybě. Zkuste to prosím znovu později.
    </Say>
    <Hangup/>
</Response>`;
      }
      
      console.log('📤 Sending fallback TwiML response...');
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
      console.log('✅ Fallback TwiML response sent');
      return;
    } catch (fallbackError) {
      console.error('❌ Fallback processing also failed:', fallbackError.message);
      
      // Final fallback - end call gracefully
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        Omlouvám se, nerozpoznal jsem vaši odpověď. Zkuste to prosím znovu později.
    </Say>
    <Hangup/>
</Response>`;
      
      console.log('📤 Sending final fallback TwiML response...');
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
      console.log('✅ Final fallback TwiML response sent');
      return;
    }
  } else {
    console.log('⚠️ No transcription text available:', {
      status: req.body.TranscriptionStatus,
      text: transcribedText,
      hasText: !!transcribedText
    });
    console.log('🔍 DEBUG: This should not happen - transcription callback without text');
    
    // END CONVERSATION GRACEFULLY FOR UNDEFINED TRANSCRIPTION
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        Omlouvám se, nerozpoznal jsem vaši odpověď. Zkuste to prosím znovu později.
    </Say>
    <Hangup/>
</Response>`;
    
    console.log('📤 Sending undefined transcription TwiML response...');
    res.set('Content-Type', 'application/xml');
    res.send(twimlResponse);
    console.log('✅ Undefined transcription TwiML response sent');
    return;
  }
  
  console.log('🎯 SMART Transcription processing ENDED');
}

// OpenAI Whisper transcription function
async function transcribeWithWhisper(audioUrl, language = 'cs') {
  try {
    console.log('🤖 WHISPER: Starting OpenAI Whisper transcription');
    console.log('🔍 DEBUG: Audio URL:', audioUrl);
    console.log('🔍 DEBUG: Language:', language);
    
    if (!OPENAI_API_KEY) {
      console.log('❌ WHISPER: No OpenAI API key configured');
      return null;
    }
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log('❌ WHISPER: No Twilio credentials configured');
      return null;
    }
    
    // Download audio from Twilio URL with proper authentication
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: TWILIO_ACCOUNT_SID,
        password: TWILIO_AUTH_TOKEN
      }
    });
    
    console.log('✅ WHISPER: Audio downloaded, size:', audioResponse.data.length);
    
    // Prepare form data for OpenAI
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioResponse.data, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });
    form.append('model', 'whisper-1');
    form.append('language', language);
    form.append('response_format', 'text');
    
    // Send to OpenAI Whisper
    const whisperResponse = await axios.post(OPENAI_WHISPER_URL, form, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      }
    });
    
    const transcription = whisperResponse.data;
    console.log('✅ WHISPER: Transcription successful:', transcription);
    
    return transcription;
  } catch (error) {
    console.error('❌ WHISPER: Transcription failed:', error.message);
    console.error('🔍 DEBUG: Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: audioUrl
    });
    return null;
  }
}

// Recording status callback handler
async function recordingStatusCallback(req, res) {
  console.log('📹 Recording status callback received');
  console.log('🔍 DEBUG: Recording status body:', req.body);
  
  const {
    CallSid,
    RecordingSid,
    RecordingUrl,
    RecordingDuration,
    RecordingStatus
  } = req.body;
  
  console.log('📊 Recording Status:', {
    CallSid,
    RecordingSid,
    RecordingUrl,
    RecordingDuration,
    RecordingStatus
  });
  
  // Update conversation state with recording info
  const recordingState = ConversationManager.getState(CallSid);
  if (recordingState) {
    recordingState.recordingUrl = RecordingUrl;
    recordingState.recordingDuration = RecordingDuration;
    console.log('✅ Updated conversation state with recording info');
  }
  
  res.status(200).send('OK');
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

module.exports = { 
  smartVoiceProcess, 
  smartTranscribeProcess,
  recordingStatusCallback
};
