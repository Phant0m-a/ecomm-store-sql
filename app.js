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
    let total = 0;
    console.log('cart at calculation time\n', cart);
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].sale_price) {

            total = total + (cart[i].sale_price * cart[i].quantity)
        } else {
            total = total + (cart[i].price * cart[i].quantity)
        }


    }
    req.session.total = total;
    return total;
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




app.get("/invoice", async (req, res) => {
    try {
        // do some action
        res.redirect('/');
    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }
});
app.post("/contact-us", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        // add db-schema and query
        let query = "INSERT INTO contact_us(name,email,phone,message) VALUES ?";
        let values = [[name, email, phone, message]];
        //uplaod data to db
        db.query(query, [values], (err, result) => {

            res.redirect('/');
        })


    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }
});


app.get("/", async (req, res) => {

    try {
        db.query("SELECT * FROM products", (err, result) => {
            res.render("index", { result: result });
        })

    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }

});

app.post("/add_to_cart", async (req, res) => {

    try {

        let { id, name, price, sale_price, quantity, image } = req.body;
        var product = { id: parseInt(id), name: name, price: parseFloat(price), sale_price: parseFloat(sale_price), quantity: parseInt(quantity), image: image };
        //1.take id and quantity. (only as user can edit other stuff and th)
        //2. use db request to get price using id then multiy by quantity to get total.  
        let cart;
        if (req.session.cart) {
            cart = await req.session.cart;
            if (!isProductInCart(cart, id)) {
                cart.push(product);
                console.log('added new product', cart);
                req.session.cart = cart;
                calculateTotal(cart, req);
            }
        } else {
            req.session.cart = [product];
            cart = await req.session.cart;
            calculateTotal(cart, req);
        }



        res.redirect('/cart');
    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }

});

app.get('/cart', async (req, res) => {
    try {
        let cart = req.session.cart;
        let total = req.session.total;

        res.render('cart', { total, cart })

    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
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
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
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
                    //re-calculate whole in-crement
                    calculateTotal(cart, req);
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
                    //re-calculate whole de-crement
                    calculateTotal(cart, req);
                }
            }
        }
    }

    res.redirect('/cart');

})

app.get('/checkout', async (req, res) => {
    try {
        var total = req.session.total;
        res.render('checkout', { total });
    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }
})


app.post('/place-order', async (req, res) => {
    try {

        let { name,
            email,
            phone,
            city,
            address,
        } = req.body;
        // name = 'demo';
        // email = 'demo@gmail.com';
        // phone = 03455555555;
        // city = 'lahore';
        // address = 'fake address';
        let cost = req.session.total;
        var products_ids = '';
        let status = 'not paid';
        let date = new Date();



        var cart = req.session.cart;
        for (let i = 0; i < cart.length; i++) {
            products_ids = products_ids + "," + cart[i].id;
        }
        let query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?";
        let values = [[cost, name, email, status, city, address, phone, date, products_ids]];
        //uplaod data to db
        db.query(query, [values], (err, result) => {

            res.redirect('/payment');
        })
        // res.render('checkout');
    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }
})


app.get('/payment', async (req, res) => {
    try {
        let total = req.session.total;
        res.render('payment', { total })
    } catch (err) {
        res.status(401).send({ success: false, message: 'something went wrong', err: err })
    }
})



app.listen(5000, () => console.log("Pomato Server Started on Port 5000"));