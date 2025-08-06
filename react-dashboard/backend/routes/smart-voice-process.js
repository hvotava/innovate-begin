const { ConversationManager } = require('./ai-conversation');
const { TestResponse } = require('../models');
const { AIEvaluator } = require('../services/ai-evaluator');
const { v4: uuidv4 } = require('uuid');

// Smart voice processing with conversation flow
async function smartVoiceProcess(req, res) {
  console.log('🧠 SMART Voice processing');
  console.log('📝 Request body:', req.body);
  
  const { RecordingUrl, CallSid, RecordingDuration } = req.body;
  
  // Check if we have a recording
  if (!RecordingUrl) {
    console.log('❌ No recording URL provided');
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Omlouvám se, nerozuměl jsem. Můžete to zopakovat?
    </Say>
    <Record 
        timeout="8"
        maxLength="30"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe"
    />
</Response>`;
    
    res.set('Content-Type', 'application/xml');
    return res.send(fallbackTwiml);
  }
  
  console.log(`🎵 Processing ${RecordingDuration}s recording: ${RecordingUrl}`);
  
  // For now, generate next question based on conversation flow
  // This could be enhanced with actual transcription processing
  const nextQuestionTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Děkuji za vaši odpověď. Pokračujme další otázkou.
    </Say>
    <Say language="cs-CZ" rate="0.8" voice="Google.cs-CZ-Standard-A">
        Nyní mi řekněte o vaší práci nebo studiu v angličtině.
    </Say>
    <Record 
        timeout="8"
        maxLength="30"
        finishOnKey="#"
        action="https://lecture-final-production.up.railway.app/api/twilio/voice/process"
        method="POST"
        transcribe="true"
        transcribeCallback="https://lecture-final-production.up.railway.app/api/twilio/voice/transcribe"
    />
    <Say language="cs-CZ" rate="0.9" voice="Google.cs-CZ-Standard-A">
        Stiskněte mřížku když dokončíte odpověď.
    </Say>
</Response>`;

  console.log('✅ SMART TwiML with shorter timeout and finish key');
  res.set('Content-Type', 'application/xml');
  res.send(nextQuestionTwiml);
}

// Enhanced transcription processor with database storage and AI evaluation
async function smartTranscribeProcess(req, res) {
  console.log('🎯 SMART Transcription processing');
  console.log('🎯 CallSid:', req.body.CallSid);
  console.log('📄 TranscriptionText:', req.body.TranscriptionText);
  console.log('📊 TranscriptionStatus:', req.body.TranscriptionStatus);
  
  const transcribedText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  
  if (transcribedText && req.body.TranscriptionStatus === 'completed') {
    console.log(`💬 User said: "${transcribedText}"`);
    
    try {
      // Get user and lesson context from call session
      const sessionContext = await getCallSessionContext(callSid);
      
      if (sessionContext && sessionContext.user && sessionContext.currentQuestion) {
        // Perform AI evaluation
        const aiEvaluation = AIEvaluator.evaluateResponse(
          sessionContext.currentQuestion,
          transcribedText,
          sessionContext.user.training_type,
          sessionContext.lessonContext
        );
        
        console.log('🧠 AI Evaluation Results:', {
          completion: `${aiEvaluation.completionPercentage}%`,
          quality: `${aiEvaluation.qualityScore}%`,
          feedback: aiEvaluation.feedback
        });
        
        // Save response to database
        const testResponse = await TestResponse.create({
          userId: sessionContext.user.id,
          trainingType: sessionContext.user.training_type,
          lessonTitle: sessionContext.lessonTitle,
          contentId: sessionContext.contentId,
          questionNumber: sessionContext.questionNumber || 1,
          question: sessionContext.currentQuestion,
          userResponse: transcribedText,
          recordingUrl: sessionContext.recordingUrl,
          recordingDuration: sessionContext.recordingDuration,
          completionPercentage: aiEvaluation.completionPercentage,
          qualityScore: aiEvaluation.qualityScore,
          aiEvaluation: aiEvaluation,
          callSid: callSid,
          testSession: sessionContext.testSession || `session_${Date.now()}`,
          isCompleted: aiEvaluation.isComplete
        });
        
        console.log('💾 Test response saved to database:', {
          id: testResponse.id,
          completion: `${testResponse.completionPercentage}%`,
          quality: `${testResponse.qualityScore}%`
        });
        
        // Process conversation continuation
        const response = await ConversationManager.processUserResponse(
          transcribedText, 
          sessionContext.questionContext || 'introduction',
          sessionContext.user.phone
        );
        
        console.log('🧠 Conversation Analysis:', response);
        
      } else {
        console.log('⚠️ No session context found for CallSid:', callSid);
      }
      
    } catch (error) {
      console.error('❌ Transcription processing error:', error.message);
      console.error('📋 Error details:', error.stack);
    }
  }
  
  res.send('OK');
}

// Get call session context (user, lesson, current question)
async function getCallSessionContext(callSid) {
  try {
    // This would ideally come from a session cache/store
    // For now, we'll use a simplified approach
    console.log('🔍 Looking up call session context for:', callSid);
    
    // In a real implementation, you'd store session data when call starts
    // and retrieve it here. For now, return a mock context
    return {
      user: { id: 1, training_type: 'safety_training', phone: '+420724369764' },
      currentQuestion: 'Popište mi bezpečnostní postupy na vašem pracovišti.',
      lessonTitle: 'Bezpečnostní Školení',
      contentId: null,
      questionNumber: 1,
      questionContext: 'safety',
      testSession: `session_${callSid}`,
      recordingUrl: null,
      recordingDuration: null
    };
    
  } catch (error) {
    console.error('❌ Error getting session context:', error.message);
    return null;
  }
}

module.exports = { smartVoiceProcess, smartTranscribeProcess };
