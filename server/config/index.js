const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log to see raw queries during development
  define: {
    timestamps: true,
    underscored: true
  }
});

module.exports = {
  sequelize,
  JWT_SECRET: process.env.JWT_SECRET || 'zaalima_jwt_secret_key_999',
  PORT: process.env.PORT || 5000 // Server port (we will run backend on 5000, frontend dev server on 3000)
};
