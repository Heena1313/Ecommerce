const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');
const User = require('./User');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  banner_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Associations
User.hasOne(Store, { foreignKey: 'userId', as: 'store', onDelete: 'CASCADE' });
Store.belongsTo(User, { foreignKey: 'userId', as: 'vendor' });

module.exports = Store;
