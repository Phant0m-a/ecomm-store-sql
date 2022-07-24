const express = require('express');
const path = require('path')
const ejs = require('ejs');
// expree session
const session = require('express-session');
const app = express();

// app.set('layout', 'layout/layout')
// app.use(expressLayouts);
app.use(session({ secret: 'damnhardsecret', resave: true, saveUninitialized: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(express.urlencoded({
    extended: true
}));

function isProductInCart(cart, id) {
    for (let i = 0; i < array.length; i++) {
        if (cart[i].id == id) {
            return true;
        }
    }
    return false;
}

const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', //Switch to Sean when go live, root when not live //
    password: "",
    // user: 'Sean', //Switch to Sean when go live, root when not live //
    // password: 'Maem250123!',
    database: 'e_commerce_node',
    multipleStatements: true,
    insecureAuth: true
});
db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log('MYSQL Connected!')
    }
})




app.get("/", async (req, res) => {
    db.query("SELECT * FROM products", (err, result) => {
        res.render("index", { result: result });
    })


});

app.post("/add_to_cart", async (req, res) => {

    try {

        let { id, name, price, sale_price, quantity, image } = req.body;
        var product = { id: id, name: name, price: price, sale_price: sale_price, quantity: quantity, image: image };


        if (req.session.cart) {
            var cart = req.session.cart;
            if (!isProductInCart(cart, id)) {
                cart.push(product);
            }
        } else {
            req.session.cart = [product];
            var cart = req.session.cart;
        }
    } catch (err) {

    }


});




app.listen(5000, () => console.log("Pomato Server Started on Port 5000"));