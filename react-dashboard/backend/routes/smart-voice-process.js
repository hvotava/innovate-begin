const { VoiceNavigationManager } = require('./voice-navigation');
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
  
  // Check if conversation is already initialized (should be done by twilio-voice-intelligent)
  const existingState = VoiceNavigationManager.getState(CallSid);
  if (!existingState) {
    console.log(`⚠️ No conversation state found for ${CallSid} - this should not happen`);
    console.log(`📋 Available states:`, Array.from(VoiceNavigationManager.conversationStates.keys()));
    return res.send(getErrorTwiml('cs')); // Default language since no state
  }
  console.log(`✅ Using existing conversation state for: ${existingState.lesson?.title}`);
  console.log(`📊 Current state: ${existingState.currentState}, Questions: ${existingState.totalQuestions}`);
  
  // Check if we have a recording URL (user response) or if this is a redirect after lesson
  if (!RecordingUrl) {
    console.log('ℹ️ No recording URL - checking if this is legitimate lesson transition or premature hangup');
    
    // Check CallStatus to distinguish between legitimate transitions and errors
    const callStatus = req.body.CallStatus;
    console.log('🔍 DEBUG: CallStatus:', callStatus);
    
    // If call was completed prematurely (duration too short) or failed, don't auto-transition
    const callDuration = parseInt(req.body.CallDuration) || 0;
    console.log('🔍 DEBUG: CallDuration:', callDuration, 'seconds');
    
    // Only auto-transition if this seems like a legitimate lesson completion
    // Calls shorter than 30 seconds are likely premature hangups, not lesson completions
    if (callStatus === 'completed' && callDuration < 30) {
      console.log('⚠️ Call completed prematurely (< 30s) - likely hangup, not lesson completion');
      console.log('🔄 Treating as error, not auto-transitioning to test');
      return res.send(getErrorTwiml('cs'));
    }
    
    if (callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
      console.log('❌ Call failed/busy/no-answer - not auto-transitioning to test');
      return res.send(getErrorTwiml('cs'));
    }
    
    try {
      const state = VoiceNavigationManager.getState(CallSid);
      if (!state) {
        console.log('❌ No conversation state found for redirect');
        return res.send(getErrorTwiml('cs')); // Default language since no state
      }
      
      const userLanguage = state?.lesson?.language || 'cs';
      const userPhone = Called || Caller;
      
      // Check if we're in lesson state and need to transition to test
      // Only do this for longer calls that seem like completed lessons
      if (state.currentState === 'lesson_playing' && callDuration >= 30) {
        console.log('🎯 Legitimate lesson completion detected - transitioning from lesson to test via AUTO_START');
        const response = await VoiceNavigationManager.processUserResponse('AUTO_START', CallSid, userPhone);
        
        console.log('🔍 DEBUG: AUTO_START response:', {
          hasResponse: !!response,
          questionType: response?.questionType,
          hasNextQuestion: !!response?.nextQuestion,
          hasFeedback: !!response?.feedback,
          nextQuestionLength: response?.nextQuestion?.length || 0
        });

        if (response && response.nextQuestion) {
          console.log('✅ Response has nextQuestion, generating TwiML with Record tag');
          const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${getTwilioLanguage(userLanguage)}" rate="0.85" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">${response.feedback}</Say>
  <Say language="${getTwilioLanguage(userLanguage)}" rate="0.85" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">${response.nextQuestion}</Say>
  <Say language="${getTwilioLanguage(userLanguage)}" rate="0.75" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">Po pípnutí řekněte svoji odpověď.</Say>
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
    transcribeLanguage="${getTwilioLanguage(userLanguage)}"
    speechTimeout="auto"
    speechModel="phone_call"
    trim="trim-silence"
  />
</Response>`;
          console.log('📤 Sending AUTO_START TwiML response...');
          console.log('🔍 DEBUG: TwiML length:', twimlResponse.length);
          console.log('🔍 DEBUG: TwiML contains Record tag:', twimlResponse.includes('<Record'));
          res.set('Content-Type', 'application/xml');
          res.send(twimlResponse);
          console.log('✅ AUTO_START TwiML response sent successfully');
          return;
        } else {
          console.log('❌ No nextQuestion in AUTO_START response, ending call');
          console.log('🔍 DEBUG: Response details:', JSON.stringify(response, null, 2));
          const errorTwiml = getErrorTwiml(userLanguage);
          res.set('Content-Type', 'application/xml');
          res.send(errorTwiml);
          return;
        }
      } else if (state.currentState === 'lesson_playing' && callDuration < 30) {
        console.log('⚠️ State is lesson_playing but call too short for legitimate completion');
        console.log('🔄 This appears to be a premature hangup during lesson');
        console.log('🔍 DEBUG: CallDuration:', callDuration, 'seconds (minimum 30s required)');
        return res.send(getErrorTwiml(userLanguage));
      } else {
        console.log('❌ State is not lesson_playing, cannot transition to test');
        console.log('🔍 DEBUG: Current state:', state.currentState);
        console.log('🔍 DEBUG: Available states:', Object.keys(state));
      }

      // Fallback for other states without RecordingUrl
      console.log('⚠️ Unexpected state without RecordingUrl:', state.currentState);
      const unexpectedUserLanguage = state?.lesson?.language || 'cs';
      return res.send(getContinueTwiml(unexpectedUserLanguage));
    } catch (err) {
      console.error('❌ Error handling redirect after lesson:', err.message);
      return res.send(getErrorTwiml('cs')); // Default language for error
    }
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
    const state = VoiceNavigationManager.getState(CallSid);
    if (!state) {
      console.log('❌ No conversation state found in fallback');
      return res.send(getErrorTwiml('cs')); // Default language since no state
    }
    
    console.log('✅ Conversation state found in fallback, attempting Whisper transcription');

    // Try Whisper directly from RecordingUrl instead of defaulting to a letter
    const userLanguage = (state && state.lesson && state.lesson.language) ? state.lesson.language : 'cs';
    const whisperTranscription = await transcribeWithWhisper(RecordingUrl, userLanguage);

    let response;
    if (whisperTranscription) {
      console.log('✅ WHISPER (direct):', whisperTranscription);
      response = await VoiceNavigationManager.processUserResponse(
        whisperTranscription,
        req.body.CallSid,
        req.body.Called || req.body.Caller
      );
      console.log('🧠 Whisper conversation response:', response);
    } else {
      console.log('❌ Whisper failed in direct path, reprompting same question without advancing');
      // Reprompt same question (do not advance index)
      const repromptLanguage = (state && state.lesson && state.lesson.language) ? state.lesson.language : 'cs';
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(repromptLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(repromptLanguage)}-Standard-A">
        Omlouvám se, nerozpoznal jsem vaši odpověď. Zopakujte prosím odpověď.
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
        language="${getTwilioLanguage(repromptLanguage)}"
        transcribeLanguage="${getTwilioLanguage(repromptLanguage)}"
        speechTimeout="auto"
        speechModel="phone_call"
        trim="trim-silence"
    />
</Response>`;
      res.set('Content-Type', 'application/xml');
      res.send(twimlResponse);
      return;
    }
    
    // Generate TwiML response
    let twimlResponse = '';
    if (response.questionType === 'session_complete') {
      console.log('🔚 Generating session_complete TwiML response');
      console.log('📋 Final feedback:', response.feedback);
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
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(userLanguage)}"
        transcribeLanguage="${getTwilioLanguage(userLanguage)}"
        speechTimeout="auto"
        speechModel="phone_call"
        trim="trim-silence"
    />
</Response>`;
    } else {
      twimlResponse = getErrorTwiml(userLanguage);
    }
    
    console.log('📤 Sending fallback TwiML response...');
    res.set('Content-Type', 'application/xml');
    res.send(twimlResponse);
    console.log('✅ Fallback TwiML response sent');
    return; // ← PŘIDÁM RETURN ABY SE NEPOKRAČOVALO!
    
  } catch (error) {
    console.error('❌ Error in fallback processing:', error.message);
    res.set('Content-Type', 'application/xml');
    res.send(getErrorTwiml('cs')); // Default language for error
    return; // ← PŘIDÁM RETURN ABY SE NEPOKRAČOVALO!
  }
  
  // This code should never be reached if fallback works
  console.log('⚠️ Fallback did not work, using default processing');
  console.log(`🎵 RecordingUrl: ${RecordingUrl}`);
  
  // Get user language from state or default to cs
  const fallbackState = VoiceNavigationManager.getState(CallSid);
  const fallbackUserLanguage = (fallbackState && fallbackState.lesson && fallbackState.lesson.language) ? fallbackState.lesson.language : 'cs';
  
  // Send basic continuation TwiML (transcription will handle the logic)
  const processTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(fallbackUserLanguage)}" rate="0.9" voice="Google.${getTwilioLanguage(fallbackUserLanguage)}-Standard-A">
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
        transcribeCallbackMethod="POST"
        language="${getTwilioLanguage(fallbackUserLanguage)}"
        transcribeLanguage="${getTwilioLanguage(fallbackUserLanguage)}"
        speechTimeout="auto"
        speechModel="phone_call"
        trim="trim-silence"
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
    const state = VoiceNavigationManager.getState(req.body.CallSid);
    const userLanguage = state?.lesson?.language || 'cs';
    console.log('🌍 User language from state:', userLanguage);
    
    // Update recording information if available
    if (req.body.RecordingUrl) {
      VoiceNavigationManager.updateRecordingInfo(
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
    console.log('✅ Transcription completed successfully, but processing is handled by action callback');
    console.log('📤 ACK transcription callback without processing (to avoid duplicate)');
    res.status(200).send('OK');
    return;
  } else if (req.body.TranscriptionStatus === 'failed') {
    console.log('❌ Twilio transcription failed, trying OpenAI Whisper fallback');
    console.log('📋 Recording URL:', req.body.RecordingUrl);
    console.log('🔍 DEBUG: Transcription failed, trying Whisper fallback');
    
    // Try OpenAI Whisper as fallback
    try {
      console.log('🤖 WHISPER: Attempting OpenAI Whisper transcription');
      
      // Get user language from state
      const whisperState = VoiceNavigationManager.getState(req.body.CallSid);
      const userLanguage = whisperState ? whisperState.userLanguage : 'cs';
      
      // Try Whisper transcription
      const whisperTranscription = await transcribeWithWhisper(req.body.RecordingUrl, userLanguage);
      
      if (whisperTranscription) {
        console.log('✅ WHISPER: Transcription successful:', whisperTranscription);
        console.log('📤 ACK Whisper transcription callback - processing will be handled by action callback');
        res.status(200).send('OK');
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
      const fallbackState = VoiceNavigationManager.getState(req.body.CallSid);
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
      
      const response = await VoiceNavigationManager.processUserResponse(
        fallbackResponse,
        req.body.CallSid,
        req.body.Called || req.body.Caller
      );
      
      console.log('🧠 Fallback conversation response:', response);
      
      // Get user language from state
      const responseState = VoiceNavigationManager.getState(req.body.CallSid);
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
        transcribeLanguage="${getTwilioLanguage(userLanguage)}"
        speechTimeout="auto"
        speechModel="phone_call"
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
      // Try to get user language from state, fallback to cs
      const errorState = VoiceNavigationManager.getState(CallSid);
      const errorUserLanguage = (errorState && errorState.lesson && errorState.lesson.language) ? errorState.lesson.language : 'cs';
      
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(errorUserLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(errorUserLanguage)}-Standard-A">
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
    // Try to get user language from state, fallback to cs
    const noTextState = VoiceNavigationManager.getState(CallSid);
    const noTextUserLanguage = (noTextState && noTextState.lesson && noTextState.lesson.language) ? noTextState.lesson.language : 'cs';
    
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(noTextUserLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(noTextUserLanguage)}-Standard-A">
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
    
    // Wait a bit for Twilio to make recording available
    console.log('⏳ WHISPER: Waiting 2s for recording to be available...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Download audio from Twilio URL with proper authentication
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
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
    form.append('temperature', '0');
    // Add prompt for better number recognition in Czech
    if (language === 'cs') {
      form.append('prompt', 'Rozpoznej čísla a písmena: A, B, C, D, jedna, dva, tři, čtyři, dvěstě šest, 206, mozek, plíce, žaludek, játra, srdce, krev');
    }
    
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
    if (error.response?.status === 404) {
      console.error('❌ WHISPER: Recording not found (404) - may not be available yet');
      console.log('⏳ WHISPER: Retrying after 3s...');
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const retryResponse = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          auth: {
            username: TWILIO_ACCOUNT_SID,
            password: TWILIO_AUTH_TOKEN
          }
        });
        console.log('✅ WHISPER: Retry successful, audio size:', retryResponse.data.length);
        // Continue with Whisper processing...
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', retryResponse.data, {
          filename: 'audio.mp3',
          contentType: 'audio/mpeg'
        });
        form.append('model', 'whisper-1');
        form.append('language', language);
        form.append('response_format', 'text');
        form.append('temperature', '0');
        // Add prompt for better number recognition in Czech
        if (language === 'cs') {
          form.append('prompt', 'Rozpoznej čísla a písmena: A, B, C, D, jedna, dva, tři, čtyři, dvěstě šest, 206, mozek, plíce, žaludek, játra, srdce, krev');
        }
        
        const whisperResponse = await axios.post(OPENAI_WHISPER_URL, form, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            ...form.getHeaders()
          }
        });
        
        const transcription = whisperResponse.data;
        console.log('✅ WHISPER: Retry transcription successful:', transcription);
        return transcription;
      } catch (retryError) {
        console.error('❌ WHISPER: Retry also failed:', retryError.message);
      }
    }
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
        const recordingState = VoiceNavigationManager.getState(CallSid);
  if (recordingState) {
    recordingState.recordingUrl = RecordingUrl;
    recordingState.recordingDuration = RecordingDuration;
    console.log('✅ Updated conversation state with recording info');
  }
  
  res.status(200).send('OK');
}

// Helper TwiML functions
function getErrorTwiml(userLanguage = 'cs') {
  const lang = getTwilioLanguage(userLanguage);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${lang}" rate="0.9" voice="Google.${lang}-Standard-A">
        Omlouvám se, došlo k chybě při načítání lekce. Zkuste to prosím později.
    </Say>
    <Hangup/>
</Response>`;
}

function getContinueTwiml(userLanguage = 'cs') {
  const lang = getTwilioLanguage(userLanguage);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${lang}" rate="0.9" voice="Google.${lang}-Standard-A">
        Omlouvám se, došlo k technické chybě. Zkuste to prosím později.
    </Say>
    <Hangup/>
</Response>`;
}

module.exports = { 
  smartVoiceProcess, 
  smartTranscribeProcess,
  recordingStatusCallback
};
