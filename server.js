const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db.js");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

app.engine("handlebars", hb({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

// first argument at a get request is a Url not path
app.get("/", (req, res) => {
    db.getSigners();
    // using a templating engine like handlebars -> use render
    res.render("home");
});

app.post("/", (req, res) => {
    db.insertUser(req.body.firstname, req.body.lastname, "whatever").then(
        newUser => {
            res.json(newUser);
        }
    );
    // on the request obj their will be a body parameter
    console.log(req.body);
});

app.get("/thanks", (req, res) => {
    res.send("<h1>Thanks</h1>");
});

app.listen(8080, () => {
    console.log("Listening on port 8080");
});
