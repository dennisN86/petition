const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db.js");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const csurf = require("csurf");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

app.engine("handlebars", hb({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// first argument at a get request is a Url not path
app.get("/", (req, res) => {
    db.getSigners();
    res.render("home");
});

function checkForSig(req, res, next) {
    !req.session.signatureId ? res.redirect("/") : next();
}

app.post("/", (req, res) => {
    if (!req.body.firstname || !req.body.lastname || !req.body.signature) {
        console.log("Error!");
    } else {
        db.insertUser(
            req.body.firstname,
            req.body.lastname,
            req.body.signature
        ).then(newUser => {
            req.session.signatureId = newUser.id;
            res.redirect("/thanks");
        });
    }
});

app.get("/thanks", checkForSig, (req, res) => {
    db.signatureId(req.session.signatureId).then(queryResults => {
        res.render("thanks", {
            id: queryResults
        });
    });
});

app.get("/participants", (req, res) => {
    db.getSigners().then(users => {
        res.render("participants", {
            listOfParticipants: users
        });
    });
});

app.listen(8080, () => {
    console.log("Listening on port 8080");
});
