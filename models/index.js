const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'cs'
  },
  current_lesson_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'users',
  timestamps: false
});

// Lesson model
const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'cs'
  },
  script: {
    type: DataTypes.TEXT
  },
  questions: {
    type: DataTypes.JSON
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  base_difficulty: {
    type: DataTypes.FLOAT,
    defaultValue: 50.0
  },
  lesson_number: {
    type: DataTypes.INTEGER
  },
  required_score: {
    type: DataTypes.FLOAT,
    defaultValue: 70.0
  },
  lesson_type: {
    type: DataTypes.STRING,
    defaultValue: 'regular'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'lessons',
  timestamps: false
});

// Attempt model
const Attempt = sequelize.define('Attempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Lesson,
      key: 'id'
    }
  },
  phone_number: {
    type: DataTypes.STRING
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
  },
  final_score: {
    type: DataTypes.FLOAT
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  call_duration: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'attempts',
  timestamps: false
});

// TestSession model
const TestSession = sequelize.define('TestSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Lesson,
      key: 'id'
    }
  },
  attempt_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Attempt,
      key: 'id'
    }
  },
  current_question_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_questions: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  questions_data: {
    type: DataTypes.JSON
  },
  difficulty_score: {
    type: DataTypes.FLOAT,
    defaultValue: 50.0
  },
  failed_categories: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  answers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  scores: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  current_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'test_sessions',
  timestamps: false
});

// Answer model
const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  test_session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: TestSession,
      key: 'id'
    }
  },
  question_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_answer: {
    type: DataTypes.TEXT
  },
  correct_answer: {
    type: DataTypes.TEXT
  },
  score: {
    type: DataTypes.FLOAT
  },
  ai_feedback: {
    type: DataTypes.TEXT
  },
  speech_confidence: {
    type: DataTypes.FLOAT
  },
  answered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'answers',
  timestamps: false
});

// Define associations
User.hasMany(Attempt, { foreignKey: 'user_id' });
Attempt.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(TestSession, { foreignKey: 'user_id' });
TestSession.belongsTo(User, { foreignKey: 'user_id' });

Lesson.hasMany(Attempt, { foreignKey: 'lesson_id' });
Attempt.belongsTo(Lesson, { foreignKey: 'lesson_id' });

Lesson.hasMany(TestSession, { foreignKey: 'lesson_id' });
TestSession.belongsTo(Lesson, { foreignKey: 'lesson_id' });

Attempt.hasMany(TestSession, { foreignKey: 'attempt_id' });
TestSession.belongsTo(Attempt, { foreignKey: 'attempt_id' });

TestSession.hasMany(Answer, { foreignKey: 'test_session_id' });
Answer.belongsTo(TestSession, { foreignKey: 'test_session_id' });

module.exports = {
  sequelize,
  User,
  Lesson,
  Attempt,
  TestSession,
  Answer
}; 