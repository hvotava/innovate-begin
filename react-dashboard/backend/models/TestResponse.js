const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestResponse = sequelize.define('TestResponse', {
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
      comment: 'Type of training (english_basic, safety_training, etc.)'
    },
    lessonTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Title of the lesson/content being tested'
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of content source if from uploaded material'
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Order of question in the test sequence'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The question that was asked'
    },
    userResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Transcribed user response'
    },
    recordingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to Twilio recording of response'
    },
    recordingDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration of recording in seconds'
    },
    completionPercentage: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true,
      comment: 'AI-evaluated completion percentage (0-100)'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true,
      comment: 'AI-evaluated quality score (0-100)'
    },
    aiEvaluation: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detailed AI evaluation results'
    },
    callSid: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Twilio call SID for tracking'
    },
    testSession: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique session identifier for grouping responses'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this response is considered complete'
    }
  }, {
    tableName: 'test_responses',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'trainingType']
      },
      {
        fields: ['callSid']
      },
      {
        fields: ['testSession']
      }
    ]
  });

  return TestResponse;
};
