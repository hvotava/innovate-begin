const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Debug sequelize import
console.log('🔍 DEBUG: sequelize loaded:', !!sequelize);
console.log('🔍 DEBUG: sequelize.define available:', !!(sequelize && sequelize.define));

const TestResult = sequelize.define('TestResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  trainingType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of training: english_basic, business, technical, etc.'
  },
  lessonTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Title of the lesson/content used'
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of uploaded content if used'
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'The question that was asked'
  },
  userAnswer: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Transcribed user response'
  },
  recordingUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to Twilio recording'
  },
  recordingDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds'
  },
  aiEvaluation: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI analysis result with scoring'
  },
  completionPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'AI-determined completion percentage (0-100)'
  },
  qualityScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'AI-determined quality score (0-100)'  
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Twilio call session ID'
  },
  testDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'test_results',
  timestamps: true
});

module.exports = TestResult;
