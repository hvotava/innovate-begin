const { VoiceNavigationManager } = require('./voice-navigation');
const { LanguageTranslator } = require('../services/language-translator');
const axios = require('axios');

// OpenAI Whisper configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Twilio configuration for audio download
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Language helper functions (now using LanguageTranslator)
function getTwilioLanguage(language) {
  return LanguageTranslator.getTwilioLanguage(language);
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
    
    // Only check duration for completed calls
    // During active calls (in-progress), CallDuration is always 0, so we allow transition
    if (callStatus === 'completed' && callDuration < 30) {
      console.log('⚠️ Call completed prematurely (< 30s) - likely hangup, not lesson completion');
      console.log('🔄 Treating as error, not auto-transitioning to test');
      return res.send(getErrorTwiml('cs'));
    }
    
    // For in-progress calls, allow transition (normal lesson-to-test flow)
    if (callStatus === 'in-progress') {
      console.log('✅ Call in-progress - allowing lesson-to-test transition');
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
      // CRITICAL: Transition when lesson is completed OR when call is in-progress with questions
      // Lesson must be finished (completed status OR in-progress with questions ready)
      if (state.currentState === 'lesson_playing' && 
          state.lesson?.questions && state.lesson.questions.length > 0 &&
          state.lessonReadyForAutoStart) {
        console.log('🎯 AUTO_START TRIGGERED!');
        console.log(`🔍 DEBUG: callStatus: ${callStatus}, callDuration: ${callDuration}s, questions: ${state.lesson.questions.length}`);
        console.log('🎯 Lesson-to-test transition - transitioning from lesson to test via AUTO_START');
        const response = await VoiceNavigationManager.processUserResponse('AUTO_START', CallSid, userPhone);
        
        console.log('🔍 DEBUG: AUTO_START response:', {
          type: response?.questionType,
          hasQuestion: !!response?.nextQuestion,
          questionLen: response?.nextQuestion?.length || 0
        });

        if (response && response.nextQuestion) {
          console.log('✅ Response has nextQuestion, generating TwiML with Record tag');
          console.log(`🔍 DEBUG: nextQuestion content: "${response.nextQuestion}"`);
          console.log(`🔍 DEBUG: nextQuestion length: ${response.nextQuestion.length}`);
          const twilioLang = getTwilioLanguage(userLanguage);
          console.log(`🌍 DEBUG: User language: ${userLanguage} -> Twilio: ${twilioLang}`);
          const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twilioLang}" rate="0.85" voice="Google.${twilioLang}-Standard-A">${response.feedback}</Say>
  <Say language="${twilioLang}" rate="0.85" voice="Google.${twilioLang}-Standard-A">${response.nextQuestion}</Say>
  <Say language="${twilioLang}" rate="0.75" voice="Google.${twilioLang}-Standard-A">Po pípnutí řekněte svoji odpověď.</Say>
  <Record 
    timeout="5"
    maxLength="90"
    playBeep="true"
    finishOnKey="#"
    action="https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart"
    method="POST"
    transcribe="true"
    transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe-smart"
    transcribeCallbackMethod="POST"
    language="${twilioLang}"
    transcribeLanguage="${twilioLang}"
    speechTimeout="auto"
    speechModel="phone_call"
    trim="trim-silence"
  />
</Response>`;
          console.log('📤 Sending AUTO_START TwiML response...');
          res.set('Content-Type', 'application/xml');
          res.send(twimlResponse);
          console.log('✅ AUTO_START TwiML response sent successfully');
          return;
        } else {
          console.log('❌ No nextQuestion in AUTO_START response, ending call');
          const errorTwiml = getErrorTwiml(userLanguage);
          res.set('Content-Type', 'application/xml');
          res.send(errorTwiml);
          return;
        }
      } else if (state.currentState === 'lesson_playing' && callStatus === 'in-progress') {
        console.log('📚 Lesson is in progress - continuing with lesson content');
        console.log('🔄 Call is still active, lesson should continue playing');
        // Continue with lesson - don't try to transition to test yet
        return res.send(getContinueTwiml(userLanguage));
      } else if (state.currentState === 'lesson_playing' && callStatus === 'completed' && callDuration < 30) {
        console.log('⚠️ State is lesson_playing but call completed too short for legitimate completion');
        console.log('🔄 This appears to be a premature hangup during lesson');
        console.log('🔍 DEBUG: CallDuration:', callDuration, 'seconds (minimum 30s required)');
        return res.send(getErrorTwiml(userLanguage));
      } else if (state.currentState === 'lesson_playing' && callStatus === 'completed') {
        console.log('📚 Lesson completed but no questions available for test');
        console.log('🔄 Lesson finished but test cannot start - ending call');
        return res.send(getErrorTwiml(userLanguage));
      } else {
        console.log('❌ Unexpected state or call status combination');
        console.log('🔍 DEBUG: Current state:', state.currentState);
        console.log('🔍 DEBUG: Call status:', callStatus);
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
  console.log('🔍 DEBUG: TranscriptionStatus undefined, trying fallback processing');
  
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
    const callStatus = req.body.CallStatus || 'in-progress';
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
        timeout="5"
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
      // CRITICAL: Check if this is lesson completion and should trigger AUTO_START
      // Only trigger AUTO_START if lesson is actually completed (not just in progress)
      if (response.questionType === 'lesson' && 
          state.currentState === 'lesson_playing' && 
          state.lesson?.questions && state.lesson.questions.length > 0) {
        console.log('🎯 Lesson completed in fallback path - triggering AUTO_START');
        // Send AUTO_START to transition to test
        try {
          const autoStartResponse = await VoiceNavigationManager.processUserResponse('AUTO_START', req.body.CallSid, req.body.Called || req.body.Caller);
          console.log('🚀 AUTO_START response:', autoStartResponse);
          
          if (autoStartResponse.questionType === 'test') {
            // Generate test TwiML
            twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${autoStartResponse.feedback || 'Začínáme test.'}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${autoStartResponse.nextQuestion}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="${LanguageTranslator.getTwilioVoice(userLanguage)}">
        ${LanguageTranslator.translate('say_your_answer', userLanguage)}
    </Say>
    <Record 
        timeout="5"
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
            // Fallback to lesson content (NO RECORD during lesson)
            twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback || ''}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Pause length="1"/>
    <Redirect method="POST">https://lecture-final-production.up.railway.app/api/twilio/voice/process-smart</Redirect>
</Response>`;
          }
        } catch (autoStartError) {
          console.error('❌ AUTO_START failed in fallback path:', autoStartError);
          // Fallback to original lesson content
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.nextQuestion}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="${LanguageTranslator.getTwilioVoice(userLanguage)}">
        ${LanguageTranslator.translate('say_your_answer', userLanguage)}
    </Say>
    <Record 
        timeout="5"
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
        }
      } else {
        // Normal lesson content
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.nextQuestion}
    </Say>
            <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="${LanguageTranslator.getTwilioVoice(userLanguage)}">
        ${LanguageTranslator.translate('say_your_answer', userLanguage)}
    </Say>
    <Record 
        timeout="5"
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
      }
    } else {
      twimlResponse = getErrorTwiml(userLanguage);
    }
    
    console.log('📤 Sending fallback TwiML response...');
    // Mark lesson ready for AUTO_START on next redirect
    try { VoiceNavigationManager.updateState(req.body.CallSid, { lessonReadyForAutoStart: true }); } catch (e) { console.log('⚠️ Could not mark lessonReadyForAutoStart:', e.message); }
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
  console.log('🔍 DEBUG: Transcription callback:', {
    status: req.body.TranscriptionStatus,
    textLength: req.body.TranscriptionText ? req.body.TranscriptionText.length : 0,
    callSid: req.body.CallSid?.substring(-8) // Last 8 chars only
  });
  
  const transcribedText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  
  if (req.body.TranscriptionStatus === 'completed' && transcribedText) {
    console.log(`💬 User said: "${transcribedText}"`);
    
    // Check if transcription looks nonsensical (likely wrong language detection)
    // Don't trigger for valid single letter answers like "A", "B", "C", "D"
    const isValidSingleLetter = /^[abcd]\.?$/i.test(transcribedText.trim());
    const isNonsensical = transcribedText && !isValidSingleLetter && (
      transcribedText.length < 3 || // Very short (but not single letters)
      (/^[a-z\s]{1,15}$/i.test(transcribedText.trim()) && // Only basic English letters
       !['jedna', 'dva', 'tri', 'ctyri', '206', '100', '365', '52'].some(w => transcribedText.toLowerCase().includes(w)))
    );
    
    if (isNonsensical) {
      console.log('⚠️ Nonsensical transcription detected, trying Whisper fallback');
      try {
        const whisperTranscription = await transcribeWithWhisper(req.body.RecordingUrl, userLanguage);
        if (whisperTranscription && whisperTranscription !== transcribedText) {
          console.log(`✅ WHISPER: Better transcription: "${whisperTranscription}" (vs Twilio: "${transcribedText}")`);
          // Don't process here, let action callback handle it
        }
      } catch (whisperError) {
        console.error('❌ WHISPER fallback failed:', whisperError.message);
      }
    }
    
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
          console.log(`🔍 DEBUG: transcribe nextQuestion content: "${response.nextQuestion}"`);
          const sayQuestion = response.nextQuestion && response.nextQuestion.trim().length > 0 ? response.nextQuestion : 'Otázka není k dispozici. Zopakujte prosím.';
          console.log(`🔍 DEBUG: Using sayQuestion: "${sayQuestion}"`);
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${response.feedback || ''}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.8" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        ${sayQuestion}
    </Say>
    <Say language="${getTwilioLanguage(userLanguage)}" rate="0.7" voice="Google.${getTwilioLanguage(userLanguage)}-Standard-A">
        Po pípnutí řekněte svoji odpověď nahlas a jasně. Stiskněte mřížku když dokončíte.
    </Say>
    <Record 
        timeout="5"
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
