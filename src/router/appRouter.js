const express = require('express');
const router = new express.Router();
const Controller = require('../controller/appController');

let routes = (app) => {
    try {
        router.post('/api/v1/product', Controller.addProduct);
        router.post('/api/v1/sales', Controller.addSales);
        router.post('/api/v1/product/search', Controller.productSearch);
        router.get('/api/v1/salesReport', Controller.salesReport);
        router.get('/api/v1/stock-report', Controller.stockReport);
        app.use(router);
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};

module.exports = routes;