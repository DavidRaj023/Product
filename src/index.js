const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const {
    Sequelize,
    sequelize
} = require('./util/databaseService');

const Product = require('./model/product');
const Stock = require('./model/stock');
const Sales = require('./model/sales');
const Price = require('./model/price');

const appRouter = require('./router/appRouter');

app.use(express.json());
appRouter(app);

//Define relations between tables
Product.hasMany(Sales);
Product.hasOne(Stock);
Sales.belongsTo(Product);
Product.hasMany(Price);

//{ force: true }
sequelize.sync().then((result) => {
    console.log("re-sync.");
    app.listen(PORT, () => {
        console.log(`Server Started and running on port: ${PORT}`);
    })
}).catch((err) => {
    console.log(err);
})