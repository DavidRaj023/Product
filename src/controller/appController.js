const Product = require('../model/product');
const Sales = require('../model/sales');
const Stock = require('../model/stock');
const Price = require('../model/price');

const {
    sequelize,
    Sequelize
} = require('../util/databaseService');
const {
    excelWriteAll
} = require('../util/excel');
const constants = require('../util/constant');
const path = require('path');
const {
    removeFilesinDir
} = require('../util/util');


exports.addProduct = async (req, res) => {
    try {
        if (!req.body) throw new Error("Please enter the values to add");

        if ((!req.body.name) || (!req.body.quantity) || (!req.body.batch)) return res.send({
            message: 'Please enter the product name / quantity / batch'
        });

        const productName = (req.body.name).toUpperCase();
        //Check for Product
        const product = await Product.findOne({
            where: {
                name: productName
            },
            include: [{
                model: Stock
            }, {
                model: Price
            }],
        });

        if (!product) {
            if (!req.body.batch) throw new Error("Enter the batch number to create a new product")
            Product.create({
                name: productName
            }).then((product) => {
                Stock.create({
                    batch: req.body.batch,
                    quantity: req.body.quantity,
                    productId: product.dataValues.id
                }).then((stock) => {
                    Price.create({
                        productId: product.dataValues.id,
                        batch: req.body.batch,
                        purchasePrice: req.body.purchasePrice,
                        sellingPrice: req.body.sellingPrice,
                        stockId: stock.id
                    })
                })
            });
            return res.status(200).send({
                message: 'Product created successfully'
            });
        };

        //Check for Batch
        const batch = await sequelize.query(`SELECT batch, quantity FROM stocks WHERE productId = ${product.id} AND batch =${req.body.batch}`)
        //If given batch is not available
        if (batch[0].length == 0) {
            Stock.create({
                batch: req.body.batch,
                quantity: req.body.quantity,
                productId: product.id
            }).then((stock) => {
                Price.create({
                    productId: product.id,
                    batch: req.body.batch,
                    purchasePrice: req.body.purchasePrice,
                    sellingPrice: req.body.sellingPrice,
                    stockId: stock.id
                })
            });

            return res.status(200).send({
                message: `New batch created for given product ${req.body.name} `
            })
        }

        //Update stock for available batch
        await Stock.update({
            quantity: req.body.quantity
        }, {
            where: {
                batch: req.body.batch
            }
        });

        return res.send({
            message: `Quantity was updated for given product ${req.body.name}`
        });

    } catch (error) {
        console.error(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while adding new product...!'
        })
    }
};

exports.addSales = async (req, res) => {
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
            include: [{
                model: Stock
            }, {
                model: Price
            }],
        });

        if (!product) throw new Error(`Given ${productName} product is not available to sale`);
        if (!(req.body.quantity > 0)) throw new Error("please enter the positive count.")

        const stock = await sequelize.query(`SELECT SUM(quantity) AS currentStock FROM stocks WHERE productId = ${product.dataValues.id}`);
        currentStock = stock[0][0].currentStock;
        const stockUpdate = currentStock - req.body.quantity;

        if (stockUpdate < 0) throw new Error(`Sorry there is no enough stock in ${productName} to buy.`)

        const allStocks = await Stock.findAll({
            raw: true,
            nest: true,
            where: {
                productId: product.dataValues.id
            },
            order: [
                ['createdAt', 'ASC']
            ],
            include: Price
        })

        let saleQuantity = req.body.quantity
        let sales = [];
        for (let stock of allStocks) {
            if (stock.quantity != 0) {
                const remains = stock.quantity - saleQuantity
                if (remains >= 0) {
                    const updateId = await Stock.update({
                        quantity: remains
                    }, {
                        where: {
                            id: stock.id
                        }
                    })
                    if (updateId != 1) throw new Error('unable to update stock');
                    
                    const addSale = await Sales.create({
                        stockId: stock.id,
                        salesQuantity: saleQuantity,
                        sellingPrice: (saleQuantity * stock.prices.sellingPrice),
                        productId: product.dataValues.id
                    })
                    sales.push(addSale.dataValues);
                    return res.status(200).send({
                        message: 'Sales Update completed',
                        data: sales
                    })
                };
                //if remains < 0
                const updateId = await Stock.update({
                    quantity: 0
                }, {
                    where: {
                        id: stock.id
                    }
                })
                if (updateId != 1) throw new Error('unable to update stock');

                const addSale = await Sales.create({
                    stockId: stock.id,
                    salesQuantity: stock.quantity,
                    sellingPrice: (stock.quantity * stock.prices.sellingPrice),
                    productId: product.dataValues.id
                });
                sales.push(addSale.dataValues);
                saleQuantity = Math.abs(remains);
            }
        }

    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while updating the stock'
        });
    }
};

exports.salesReport = async (req, res) => {
    try {
        const sales = await Sales.findAll({
            raw: true,
            attributes: {
                exclude: ['stockId', 'createdAt', 'updatedAt']
            },
            order: [
                ['ProductId', 'ASC']
            ]
        })

        for (const key in sales) {
            const sale = sales[key];
            const product = await Product.findOne({
                raw: true,
                where: {
                    id: sale.productId
                },
            })
            sale.productName = product.name;
        };
        removeFilesinDir(path.join(__dirname, `../../data/`));
        const filePath = (path.join(__dirname, `../../data/Sales_Report${new Date().getTime()}.xlsx`));
        await excelWriteAll(sales, constants.SALES_HEADER, filePath);

        res.send({
            filePath: filePath,
            data: sales
        })

    } catch (error) {
        res.status(400).send({
            message: error.message || 'Somthing went wrong while getting a report'
        })
    }
}

exports.productSearch = async (req, res) => {
    try {
        if ((!req.body.name)) return res.send({
            message: 'Please enter the product name'
        });

        const productName = (req.body.name).toUpperCase();
        const product = await Product.findOne({
            raw: true,
            where: {
                name: productName
            }
        });

        if (!product) throw new Error(`Given ${productName} product is not available to sale`);

        const stocks = await Stock.findAll({
            raw: true,
            nest: true,
            attributes: {
                exclude: ['id', 'createdAt', 'updatedAt', 'productId']
            },
            where: {
                productId: product.id
            },
            include: {
                model: Price,
                attributes: {
                    exclude: ['id', 'batch', 'purchasePrice', 'productId', 'createdAt', 'updatedAt', 'stockId']
                }
            }
        });

        res.status(200).send({
            data: stocks
        })
    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while updating the stock'
        });
    }
};

exports.stockReport = async (req, res) => {
    try {
        let QUERY = `SELECT stocks.id, products.name, stocks.batch, stocks.quantity, prices.purchasePrice, prices.sellingPrice FROM prices JOIN stocks on prices.id = stocks.id JOIN products on stocks.productId = products.id WHERE stocks.quantity !=0`;
        const QUERY_EMPTY_BATCH = `SELECT stocks.id, products.name, stocks.batch, stocks.quantity, prices.purchasePrice, prices.sellingPrice FROM prices JOIN stocks on prices.id = stocks.id JOIN products on stocks.productId = products.id`;

        if (req.body.includeEmptyBatch) {
            QUERY = QUERY_EMPTY_BATCH;
        }
        const stocks = await sequelize.query(QUERY);
        
        removeFilesinDir(path.join(__dirname, `../../data/`));
        const filePath = (path.join(__dirname, `../../data/Stock_Report${new Date().getTime()}.xlsx`));
        await excelWriteAll(stocks[0], constants.STOCK_HEADER, filePath);

        return res.status(200).send({
            file: filePath,
            data: stocks
        })
    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: error.message || 'Somthing went wrong while downloading stock report'
        })
    }
}