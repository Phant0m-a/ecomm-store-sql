const express = require('express');
const path = require('path')
const ejs = require('ejs');

const app = express();
const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', //Switch to Sean when go live, root when not live //
    password: "",
    // user: 'Sean', //Switch to Sean when go live, root when not live //
    // password: 'Maem250123!',
    database: 'pamota',
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

app.use(express.urlencoded({
    extended: true
}))


// app.set('layout', 'layout/layout')
// app.use(expressLayouts);

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')


app.get("/", async (req, res) => {
    res.render("index")
   
});



app.listen(5000, () => console.log("Pomato Server Started on Port 5000"));