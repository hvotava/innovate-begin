const axios = require('axios');

// Simple AI conversation handler
class ConversationManager {
  
  // Analyze transcribed text and generate response
  static async processUserResponse(transcribedText, questionContext, userPhone) {
    try {
      console.log(`🧠 Processing response: "${transcribedText}"`);
      
      // Simple pattern matching for placement test
      if (questionContext === 'introduction') {
        return {
          feedback: this.analyzeIntroduction(transcribedText),
          nextQuestion: "Great! Now tell me about your work or studies in English.",
          questionType: 'work'
        };
      } else if (questionContext === 'work') {
        return {
          feedback: this.analyzeWork(transcribedText),
          nextQuestion: "Perfect! What are your hobbies or what do you like to do in your free time?",
          questionType: 'hobbies'
        };
      } else if (questionContext === 'hobbies') {
        return {
          feedback: this.analyzeHobbies(transcribedText),
          nextQuestion: "Thank you! That completes our assessment. Based on your answers, I'll now provide feedback.",
          questionType: 'complete'
        };
      }
      
      return {
        feedback: "Thank you for your response.",
        nextQuestion: "Let's continue with the next topic.",
        questionType: 'general'
      };
      
    } catch (error) {
      console.error('❌ Conversation processing error:', error.message);
      return {
        feedback: "I understand. Let's continue.",
        nextQuestion: "Can you tell me more?",
        questionType: 'fallback'
      };
    }
  }
  
  static analyzeIntroduction(text) {
    const hasName = /name.*is/i.test(text) || /i.*am/i.test(text);
    const hasCountry = /from|come|live|czech|republic|prague/i.test(text);
    
    if (hasName && hasCountry) {
      return "Excellent! Your introduction was clear and well-structured.";
    } else if (hasName) {
      return "Good start with your name. Try to also mention where you're from.";
    } else {
      return "I can see you're trying. Let's practice more introductions.";
    }
  }
  
  static analyzeWork(text) {
    const workWords = /work|job|study|student|teacher|engineer|manager|company/i.test(text);
    const isLonger = text.split(' ').length > 5;
    
    if (workWords && isLonger) {
      return "Very good! You provided good details about your work.";
    } else if (workWords) {
      return "Good topic choice. Try to add more details next time.";
    } else {
      return "I understand. Try to mention what you do for work or study.";
    }
  }
  
  static analyzeHobbies(text) {
    const hobbyWords = /like|love|enjoy|hobby|play|read|music|sport|travel/i.test(text);
    const length = text.split(' ').length;
    
    if (hobbyWords && length > 8) {
      return "Fantastic! You expressed your interests very clearly.";
    } else if (hobbyWords) {
      return "Nice! Your hobbies are interesting.";
    } else {
      return "Thank you for sharing. Keep practicing expressing your interests.";
    }
  }
  
  // Generate final assessment
  static generateAssessment(responses) {
    // Simple scoring based on response quality
    let score = 0;
    if (responses.introduction) score += responses.introduction.includes('Excellent') ? 3 : 2;
    if (responses.work) score += responses.work.includes('Very good') ? 3 : 2;  
    if (responses.hobbies) score += responses.hobbies.includes('Fantastic') ? 3 : 2;
    
    if (score >= 8) {
      return {
        level: 'B1',
        feedback: "Excellent work! Your English is at intermediate level. You can express yourself clearly.",
        recommendation: "Continue with Level 2 lessons focusing on complex conversations."
      };
    } else if (score >= 6) {
      return {
        level: 'A2', 
        feedback: "Good progress! Your English is at elementary level with room for improvement.",
        recommendation: "Start with Level 1 lessons focusing on basic conversations."
      };
    } else {
      return {
        level: 'A1',
        feedback: "Keep practicing! We'll start with beginner-friendly lessons.",
        recommendation: "Begin with Level 1 lessons focusing on simple phrases and vocabulary."
      };
    }
  }
}

module.exports = { ConversationManager };
