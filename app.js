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
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id == id) {
            return true;
        }
    }
    return false;
}

function calculateTotal(cart, req) {
    total = 0;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].sale_price) {
            total = total + (cart[i].sale_price * cart[i].quantity)
        } else {
            total = total + (cart[i].price * cart[i].quantity)
        }
        req.session.total = total;
        return total;

    }
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

    try {
        db.query("SELECT * FROM products", (err, result) => {
            res.render("index", { result: result });
        })

    } catch (err) {
        res.send('error accured!', { message: err });
    }

});

app.post("/add_to_cart", async (req, res) => {

    try {

        let { id, name, price, sale_price, quantity, image } = req.body;
        var product = { id: id, name: name, price: price, sale_price: sale_price, quantity: quantity, image: image };
        //1.take id and quantity. (only as user can edit other stuff and th)
        //2. use db request to get price using id then multiy by quantity to get total.  

        if (req.session.cart) {
            var cart = req.session.cart;
            if (!isProductInCart(cart, id)) {
                cart.push(product);
            }
        } else {
            req.session.cart = [product];
            var cart = req.session.cart;
        }


        calculateTotal(cart, req);

        res.redirect('/cart');
    } catch (err) {
        res.send('error accured!', { message: err });
    }

});

app.get('/cart', async (req, res) => {
    try {
        var cart = req.session.cart;
        var total = req.session.total;

        res.render('cart', { total, cart })

    } catch (err) {
        res.send('error accured!', { message: err });
    }
})

app.post('/remove_product', async (req, res) => {

    try {

        var { id } = req.body;
        var cart = req.session.cart;

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == id) {
                cart.splice(cart.indexOf(i), 1);
            }

            //re-calculate the price total
            calculateTotal(cart, req);
            res.redirect('/cart');

        }

        res.redirect('/cart');
    } catch (err) {
        res.send('error accured!', { message: err });
    }
})

app.post('/edit_product_quantity', (req, res) => {
    var { id,
        quantity,
        increase_product_quantity,
        decrease_product_quantity } = req.body;
    var cart = req.session.cart;
    // var total = req.session.total;

    if (increase_product_quantity) {
        for (let i = 0; i < cart.length; i++) {
            //get product with matching id and increase quantity
            if (cart[i].id == id) {
                if (cart[i].quantity > 0) {
                    cart[i].quantity = parseInt(cart[i].quantity) + 1;
                }
            }
        }
    }

    if (decrease_product_quantity) {
        for (let i = 0; i < cart.length; i++) {
            //get product with matching id and increase quantity
            if (cart[i].id == id) {
                if (cart[i].quantity > 1) {
                    cart[i].quantity = parseInt(cart[i].quantity) - 1;
                }
            }
        }
    }
    //re-calculate the price total
    calculateTotal(cart, req);
    res.redirect('/cart');

})

app.get('/checkout', async (req, res) => {
    try {
        var total = req.session.total;
        res.render('checkout', { total });
    } catch (err) {
        res.send('error accured', err);
    }
})


app.post('/place-order', async (req, res) => {
    try {

        // const { name,
        //     email,
        //     phone,
        //     city,
        //     address,
        // } = req.body;
        name = 'demo';
        email = 'demo@gmail.com';
        phone = 03455555555;
        city = 'lahore';
        address = 'fake address';
        let cost = req.session.total;
        var products_ids = '';
        let status = 'not paid';
        let date = new Date();



        var cart = req.session.cart;
        for (let i = 0; i < cart.length; i++) {
            products_ids = products_ids + "," + cart[i].id;
        }
        var query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?";
        var values = [[cost, name, email, status, city, address, phone, date, products_ids]];
        //uplaod data to db
        db.query(query, [values], (err, result) => {
            console.log('here', query);
            res.redirect('/payment');
        })
        // res.render('checkout');
    } catch (err) {
        res.send('error accured', err);
    }
})


app.get('/payment', async (req, res) => {
    try {
        let total = req.session.total;
        res.render('payment', { total })
    } catch (err) {
        res.send('error accured', err);
    }
})


app.listen(5000, () => console.log("Pomato Server Started on Port 5000"));