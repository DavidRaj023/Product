const Product = require('../model/product');
const Sales = require('../model/sales');
const Stock = require('../model/stock');
const {sequelize, Sequelize} = require('../util/databaseService');
const {excelWriteAll} = require('../util/excel');
const constants = require('../util/constant');
const path = require('path');
const {removeFilesinDir} = require('../util/util');


exports.addProduct = async(req, res) => {
    try {
        if (!req.body) throw new Error("Please enter the values to add");

        if ((!req.body.name) || (!req.body.quantity)) return res.send({
            message: 'Please enter the product name / quantity'
        });

        const productName = (req.body.name).toUpperCase();
        const product = await Product.findOne({
            where: {
                name: productName
            },
            include: Stock
        });
        
        if(product){
            if(!(req.body.quantity >0) ) throw new Error("please enter the positive quantity to update")
            
            const currentStock = product.dataValues.stock.quantity;
            const stockUpdate = currentStock + req.body.quantity;
            await Stock.update({quantity: stockUpdate}, {
                where: { productId: product.dataValues.id}
            });
            return res.status(200).send({ message: 'Product stock updated successfully'});
        }
        
        Product.create({
            name: productName
        }).then((data) => {
            Stock.create({
                quantity: req.body.quantity,
                productId: data.dataValues.id
            });
        });
        
        res.status(200).send({message: 'Product created successfully'});

    } catch (error) {
        console.error(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while adding new product...!'
        })
    }
};

exports.addSales = async(req, res) => {
    try {
        if (!req.body) throw new Error("Please enter the values to add stock");

        if ((!req.body.name) || (!req.body.quantity)) return res.send({
            message: 'Please enter the product name / quantity'
        });

        const productName = (req.body.name).toUpperCase();
        const product = await Product.findOne({
            where: {
                name: productName
            },
            include: Stock
        });
        
        if(!product) throw new Error(`Given ${productName} product is not available to sale`);
        if(!(req.body.quantity >0) ) throw new Error("please enter the positive count.")

        const currentStock = product.dataValues.stock.quantity;
        const stockUpdate = currentStock - req.body.quantity;
        
        if(stockUpdate < 0) throw new Error(`Sorry there is no enough stock in ${productName} to buy.`)
        
        const update = await Stock.update({quantity: stockUpdate}, {
            where: { productId: product.dataValues.id}
        });
        
        if( update != 1) throw new Error('unable to update stock');

        const addSale = await Sales.create({
            salesQuantity: req.body.quantity,
            productId: product.dataValues.id
        })
        res.status(200).send({
            message: 'Sales details added successfully'
        })
    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while updating the stock'
        });
    }
};

exports.report = async(req, res) => {
    try {
        const products = await Product.findAll({raw: true, nest: true,
            attributes: {exclude: ['createdAt', 'updatedAt']},
        });
        
        for(const key in products) {
            const product = products[key];

            //get current quantity
            const [stock] = await sequelize.query(`SELECT quantity from stocks where productId = ${product.id}`);
            product.currentStock = stock[0].quantity

            //get sales Count
            const [results, metadata]   = await sequelize.query(`SELECT SUM(salesQuantity) as salesCount from sales WHERE productId = ${product.id}`)
            product.salesValue = (results[0].salesCount == null) ? 0 : results[0].salesCount;
            // product.salesValue = results[0].salesCount;
            product.totalQuantity = product.currentStock + product.salesValue;
            
        };
        
        removeFilesinDir(path.join(__dirname, `../../data/`));
        const filePath = (path.join(__dirname, `../../data/Product_${new Date().getTime()}.xlsx`));
        await excelWriteAll(products, constants.HEADER, filePath);
        
        res.send({
            filePath: filePath,
            data: products
        })

    } catch (error) {
        res.status(400).send({
            message: error.message || 'Somthing went wrong while getting a report'
        })
    }
}