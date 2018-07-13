// matts encounter

// setting cookie
res.cookie("nameOfcookie", true);

//read cookie
req.cookies.nameOfcookie;

req.sessions = {
    signed: true
}
// reading values from object
req.session.signed -> true

// middleware to make them sign the petition
req.session.signatureId = signature.id

if (!req.session.signatureId) {
    res.redirect("/")
} else {
    next()
}


db.getSig(req.session.signatureId)

//
// Don't know where this goes
//

// global-route
// middleware to check if the user has signed the petition
// checking for the cookie in the session
app.use((req, res, next) => {
    if (!req.session.signatureId) {
        res.redirect("/");
    } else {
        next();
    }
});

// single-route

function checkForSig(req, res, next) {
    if (!req.session.signatureId) {
        res.redirect("/");
    } else {
        next();
    }
}

function checkForSig(req, res, next) {
    !req.session.signature ? res.redirect("/") : next();
}

// function checkForSig invoked by app.get function underneath
app.get("/thanks", checkForSig, (req, res, next));

//
//
//

// Ivanas encounter
//
// replaces the cookie session in the server.js

var session = require('express-session');
var Store = require('connect-redis')(session);

app.use(session({
    store: new Store({
        ttl: 3600,
        host: 'localhost',
        port: 6379
    }),
    resave: false,
    saveUninitialized: true,
    secret: 'my super fun secret'
}));
