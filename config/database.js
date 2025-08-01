const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl.startsWith('sqlite:')) {
  // SQLite konfigurace pro lokální vývoj
  const dbPath = databaseUrl.replace('sqlite:///', '');
  console.log('SQLite database path:', dbPath);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  // PostgreSQL konfigurace pro produkci
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
}

module.exports = { sequelize }; 