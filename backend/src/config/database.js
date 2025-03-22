const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/manageme', {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize; 