const express = require('express');
const router = new express.Router();
const Controller = require('../controller/appController');

let routes = (app) => {
    try {
        router.post('/api/v1/product', Controller.addProduct);
        router.post('/api/v1/sales', Controller.addSales);
        router.get('/api/v1/report', Controller.report);
        app.use(router);
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};

module.exports = routes;