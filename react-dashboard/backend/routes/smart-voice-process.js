const { ConversationManager } = require('./ai-conversation');

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

// Enhanced transcription processor
async function smartTranscribeProcess(req, res) {
  console.log('🎯 SMART Transcription processing');
  console.log('🎯 CallSid:', req.body.CallSid);
  console.log('📄 TranscriptionText:', req.body.TranscriptionText);
  console.log('📊 TranscriptionStatus:', req.body.TranscriptionStatus);
  
  const transcribedText = req.body.TranscriptionText;
  
  if (transcribedText && req.body.TranscriptionStatus === 'completed') {
    console.log(`💬 User said: "${transcribedText}"`);
    
    try {
      // Process with AI conversation manager
      const response = await ConversationManager.processUserResponse(
        transcribedText, 
        'introduction', // This would be dynamic based on conversation state
        req.body.From
      );
      
      console.log('🧠 AI Analysis:', response);
      
      // Here you could update user progress in database
      // or trigger next question generation
      
    } catch (error) {
      console.error('❌ Transcription processing error:', error.message);
    }
  }
  
  res.send('OK');
}

module.exports = { smartVoiceProcess, smartTranscribeProcess };
