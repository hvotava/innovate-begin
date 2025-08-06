const { DataTypes } = require('sequelize');

// Migration to create test_responses table
async function up(sequelize) {
  await sequelize.getQueryInterface().createTable('test_responses', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    trainingType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'training_type'
    },
    lessonTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lesson_title'
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'content_id'
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'question_number'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_response'
    },
    recordingUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'recording_url'
    },
    recordingDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'recording_duration'
    },
    completionPercentage: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true,
      field: 'completion_percentage'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true,
      field: 'quality_score'
    },
    aiEvaluation: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'ai_evaluation'
    },
    callSid: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'call_sid'
    },
    testSession: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'test_session'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_completed'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  });

  console.log('✅ test_responses table created successfully');
}

async function down(sequelize) {
  await sequelize.getQueryInterface().dropTable('test_responses');
  console.log('❌ test_responses table dropped');
}

module.exports = { up, down };
