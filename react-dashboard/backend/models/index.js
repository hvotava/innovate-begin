const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Company model
const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'companies',
  timestamps: false
});

// User model - rozšířený o autentifikaci
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
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true  // Dočasně nullable pro migraci
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true  // Dočasně nullable pro migraci
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  companyId: {
    type: DataTypes.INTEGER,
    references: {
      model: Company,
      key: 'id'
    },
    allowNull: true
  },
  // Původní pole pro kompatibilitu
  phone: {
    type: DataTypes.STRING,
    unique: false,  // změněno z unique na false
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'cs'
  },
  current_lesson_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false
});

// Training model
const Training = sequelize.define('Training', {
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
  companyId: {
    type: DataTypes.INTEGER,
    references: {
      model: Company,
      key: 'id'
    },
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'trainings',
  timestamps: false
});

// Lesson model - upravený pro Training
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  trainingId: {
    type: DataTypes.INTEGER,
    references: {
      model: Training,
      key: 'id'
    },
    allowNull: false
  },
  // Původní pole pro kompatibilitu
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
    type: DataTypes.STRING,
    defaultValue: 'beginner'
  },
  base_difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  lesson_number: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  required_score: {
    type: DataTypes.FLOAT,
    defaultValue: 90.0
  },
  lesson_type: {
    type: DataTypes.STRING,
    defaultValue: 'standard'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'lessons',
  timestamps: false
});

// Test model
const Test = sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  questions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  trainingId: {
    type: DataTypes.INTEGER,
    references: {
      model: Training,
      key: 'id'
    },
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tests',
  timestamps: false
});

// UserTraining model
const UserTraining = sequelize.define('UserTraining', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  },
  trainingId: {
    type: DataTypes.INTEGER,
    references: {
      model: Training,
      key: 'id'
    },
    allowNull: false
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0  // 0-100%
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_trainings',
  timestamps: false
});

// Původní modely pro kompatibilitu
// Attempt model
const Attempt = sequelize.define('Attempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Lesson,
      key: 'id'
    }
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'in_progress'
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
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
    references: {
      model: User,
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
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
    defaultValue: 0
  },
  questions_data: {
    type: DataTypes.JSON,
    allowNull: false
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
  attempt_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Attempt,
      key: 'id'
    }
  },
  question_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  question_text: {
    type: DataTypes.TEXT
  },
  correct_answer: {
    type: DataTypes.TEXT
  },
  user_answer: {
    type: DataTypes.TEXT
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feedback: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'answers',
  timestamps: false
});

// Associations
// Company associations
Company.hasMany(User, { foreignKey: 'companyId' });
Company.hasMany(Training, { foreignKey: 'companyId' });

// User associations
User.belongsTo(Company, { foreignKey: 'companyId' });
User.hasMany(UserTraining, { foreignKey: 'userId' });
User.hasMany(Attempt, { foreignKey: 'user_id' });
User.hasMany(TestSession, { foreignKey: 'user_id' });

// Training associations
Training.belongsTo(Company, { foreignKey: 'companyId' });
Training.hasMany(Lesson, { foreignKey: 'trainingId' });
Training.hasMany(Test, { foreignKey: 'trainingId' });
Training.hasMany(UserTraining, { foreignKey: 'trainingId' });

// Lesson associations
Lesson.belongsTo(Training, { foreignKey: 'trainingId' });
Lesson.hasMany(Attempt, { foreignKey: 'lesson_id' });
Lesson.hasMany(TestSession, { foreignKey: 'lesson_id' });

// Test associations
Test.belongsTo(Training, { foreignKey: 'trainingId' });

// UserTraining associations
UserTraining.belongsTo(User, { foreignKey: 'userId' });
UserTraining.belongsTo(Training, { foreignKey: 'trainingId' });

// Původní associations pro kompatibilitu
Attempt.belongsTo(User, { foreignKey: 'user_id' });
Attempt.belongsTo(Lesson, { foreignKey: 'lesson_id' });
Attempt.hasMany(Answer, { foreignKey: 'attempt_id' });

TestSession.belongsTo(User, { foreignKey: 'user_id' });
TestSession.belongsTo(Lesson, { foreignKey: 'lesson_id' });
TestSession.belongsTo(Attempt, { foreignKey: 'attempt_id' });

Answer.belongsTo(Attempt, { foreignKey: 'attempt_id' });

module.exports = {
  sequelize,
  Company,
  User,
  Training,
  Lesson,
  Test,
  UserTraining,
  Attempt,
  TestSession,
  Answer
}; 