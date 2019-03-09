require("dotenv").config();
// import {inquirer, mysql} from './package.json';
const inquirer = require("inquirer");
const mysql = require("mysql");
const moment = require("moment");
const {table} = require("table");
let data = [];
let output;

const connection = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "onlineStores"
});

connection.connect();

const updateSales = (itemId, quantityBought, dept, timeBought, name, price) => {
    let salesTotal = quantityBought * price;
    let queryPost = {product_id: itemId, quantity_purchased: quantityBought, department: dept, purchase_time: timeBought, product_name: name, sales_total: salesTotal};
    connection.query("INSERT INTO product_sales SET ?", queryPost, 
    function(err, res, fields) {
        if(err) throw err;
        // !err ? console.log("Sales Updated") : console.log("Sales is sad.. no update");
    })
    connection.end();
};

const sellItems = () => {
    inquirer.prompt([
        {
            type: "input",
            name: "productId",
            message: "Take a look at the items above, please enter the ID number of the product you'd like to purchase"
        },
        {
            type: "input",
            name: "quantity",
            message: "How many of this item would you like to purchase?"
        }
    ]).then(function(answers) {
        buyProducts(parseInt(answers.productId), parseInt(answers.quantity));
    })
};

const buyProducts = (item, quantity) => {
    let currentQuantity;
    connection.query("SELECT stock_quantity, price, product_name, department_name FROM products WHERE item_id = ?", [connection.escape(item)], function(err, res, fields) {
        if (err) throw err;
        currentQuantity = res[0].stock_quantity;
        let department = res[0].department_name;
        let updateQuantity = currentQuantity - quantity;
        let cost = res[0].price;
        let productName = res[0].product_name
        let purchaseTime = moment().unix();
        if (updateQuantity >= 0) {
            connection.query("UPDATE products SET stock_quantity = ? WHERE item_id= ?", [connection.escape(updateQuantity), connection.escape(item)], function(err, res, fields) {
                if (err) throw err;
                console.log(`
                Thank you for your order!
                Summary: You bought ${quantity}x ${productName}
                Total Cost: $${cost * quantity}
                Delivery: Eventually..
                `);
                updateSales(item, quantity, department, purchaseTime, productName, cost);
            });
        } else if (updateQuantity < 0) {
            console.log(`We are sorry, we only have ${currentQuantity} left for that product. You are welcome to reduce your order to ${currentQuantity} and try again.`);
            connection.end();
        };
    });
};

const allProducts = (tableChoice) => {
    connection.query("SELECT * FROM " + tableChoice + " ORDER BY item_id", function(err, results, fields) {
        if (err) throw err;
        // console.log(results);
        results.forEach(function(elem) {
            let row = [];
            row.push(`ID: ${elem.item_id}`, `Name: ${elem.product_name}`, `Quantity: ${elem.stock_quantity}`, `Price: $${parseInt(elem.price)}`, `Description: ${elem.description}`);
            data.push(row);
            // console.log(`
            // ID: ${elem.item_id}
            // Product: ${elem.product_name}
            // Quantity Available: ${elem.stock_quantity}
            // Price: $${parseInt(elem.price)}
            // Description: ${elem.description}
            // `);
        });
        output = table(data);

        console.log(output);
        sellItems();
    });
};

inquirer.prompt([
    {
        type: "confirm",
        name: "welcome",
        message: "Want to look at what products we have to offer?"
    }
]).then(function(answers) {
    if (answers.welcome) {
        allProducts("products")
    } else {
        console.log(`Sorry to see you go, please come again soon!`);
        process.exit();
    };
});
