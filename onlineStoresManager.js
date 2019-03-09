require("dotenv").config();
// import {inquirer, mysql} from './package.json';
const inquirer = require("inquirer");
const mysql = require("mysql");
const {table} = require('table');
let data = [];
let output;


const connection = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "onlineStores"
});

connection.connect();

const salesByDept = () => {
    connection.query("SELECT department, SUM(sales_total) AS total_sales FROM product_sales GROUP BY department", function(err, res, fields) {
        if (err) throw err;
        data = [];        
        res.forEach(function(elem) {
            let row = [elem.department, "$" + elem.total_sales]
            data.push(row);
        })
        output = table(data);
        console.log(output)
    });
    connection.end();
};

const newItem = (name, dept, price, stock, desc) => {
    let queryPost = {product_name: name, department_name: dept, price: price, stock_quantity: stock, description: desc};
    connection.query("INSERT INTO products SET ?", queryPost, 
    function(err, res, fields) {
        if(err) throw err;
        console.log(`
        Great! We needed some new inventory!
        Item Added: Name: ${name} Dept: ${dept} Price: ${price} Stock: ${stock} Description: ${desc}
        `)
    })
    connection.end();
};

const lowInventory = () => {
    connection.query("SELECT product_name FROM products WHERE stock_quantity < 5", function(err, res, fields) {
        if (err) throw err;
        console.log("You better get to ordering these items!");
        res.forEach(function(elem) {
            console.log(`-${elem.product_name}`);
        })
    });
    connection.end();

};

const addInventory = (amountAdded, prodID) => {
    let currentQuantity;
    let productName;
    connection.query("SELECT stock_quantity, product_name FROM products WHERE item_id = ?", parseInt(prodID), function(err, res, fields) {
        currentQuantity = res[0].stock_quantity;
        productName = res[0].product_name;
        let updateQuantity = parseInt(currentQuantity) + parseInt(amountAdded);
        connection.query("UPDATE products SET stock_quantity = ? WHERE item_id=?", [updateQuantity,parseInt(prodID)], function(err, res, fields) {
            if (err) throw err;
            console.log(`
            Inventory Changed: ${productName} previously at ${currentQuantity} in inventory, now at ${updateQuantity} in inventory
            `);
        });
        connection.end();

    });
  
};

const allProducts = (table) => {
    connection.query("SELECT * FROM " + table, function(err, results, fields) {
        if (err) throw err;
        results.forEach(function(elem) {
            console.log(`
            ID: ${elem.item_id}
            Product: ${elem.product_name}
            Quantity Available: ${elem.stock_quantity}
            Price: $${parseInt(elem.price)}
            Description: ${elem.description}
            `);
        })
    });
    connection.end();
};

const inventoryQuestions = () => {
    inquirer.prompt([
        {
            type: "input",
            name: "productID",
            message: "What's the ID of the product?"
        },
        {
            type: "input",
            name: "inventory",
            message: "How much inventory is being added?"
        }
    ]).then(function(answers) {
        addInventory(answers.inventory, answers.productID);
    });
};

const addItemQuestions = () => {
    inquirer.prompt([
        {
            type: "input",
            name: "itemName",
            message: "What's the name of the new product?"
        },
        {
            type: "input",
            name: "department",
            message: "Which department will this item be added?"
        },
        {
            type: "input",
            name: "price",
            message: "What is the price of this item?"
        },
        {
            type: "input",
            name: "stock",
            message: "How much stock will be added to the store upon arrival?"
        },
        {
            type: "input",
            name: "description",
            message: "What is a description for this product?"
        }
    ]).then(function(answers){
        newItem(answers.itemName, answers.department, answers.price, answers.stock, answers.description);
    });
};

inquirer.prompt([
    {
        type: "list",
        name: "functionMenu",
        message: "What would you like to do?",
        choices: ["See all products", "See low inventory", "Add a new product", "Add inventory to current product", "Sales by department"]
    }
]).then(function(answers) {
    switch(answers.functionMenu) {
        case "See all products":
        allProducts("products");
        break;
        case "See low inventory":
        lowInventory();
        break;
        case "Add a new product":
        addItemQuestions();
        break;
        case "Add inventory to current product":
        inventoryQuestions();
        break;
        case "Sales by department":
        salesByDept();
        break;
    };
});