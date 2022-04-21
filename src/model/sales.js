const {
    Sequelize,
    sequelize
} = require("../util/databaseService");

const Sales = sequelize.define("sales", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    salesQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    sellingPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
    }
});

module.exports = Sales;