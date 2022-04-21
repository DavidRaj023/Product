const dbConfig = require('../config/dbConfig');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

sequelize.authenticate().then((err) => {
  console.log('Connection successful...!');
})
.catch((err) => {
  console.log('Unable to connect to database', err);
});

module.exports = {
  Sequelize,
  sequelize
}