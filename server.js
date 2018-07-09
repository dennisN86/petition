const express = require("express");
const app = express();
const hb = require("express-handlebars");
const db = require("./db/db");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const csurf = require("csurf");
const bc = require("./db/bcrypt");

///////////////////////////////////////////
////////////// middleware /////////////////
///////////////////////////////////////////

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

app.engine("handlebars", hb({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

/////////////////////////////////////////
//////////// homepage ///////////////////
/////////////////////////////////////////

app.get("/", (req, res) => {
    db.getSigners();
    res.render("home");
});

//////////////////////////////////////////
///////////// registration ///////////////
//////////////////////////////////////////

app.get("/registration", (req, res) => {
    db.registration();
    res.render("registration");
});

app.post("/registration", (req, res) => {
    if (
        !req.body.firstname ||
        !req.body.lastname ||
        !req.body.emailaddress ||
        !req.body.password
    ) {
        console.log("Error!");
    } else {
        bc.hashPassword(req.body.password).then(resolve => {
            db.registerUser(
                req.body.firstname,
                req.body.lastname,
                req.body.emailaddress,
                resolve
            ).then(newUser => {
                req.session.user = newUser;
                res.redirect("/additionalInformation");
                console.log(newUser);
            });
        });
    }
});

////////////////////////////////////////////
/////////////// Log In /////////////////////
////////////////////////////////////////////

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    db.getEmails(req.body.emailaddress).then(results => {
        if (results && results.email) {
            console.log("Emailaddress: ", results.email, "found");
            db.getPassword(req.body.emailaddress).then(savedHashedPassword => {
                bc.checkPassword(req.body.password, savedHashedPassword)
                    .then(() => {
                        db.getUser(req.body.emailaddress).then(matchedUser => {
                            req.session.user = matchedUser;
                            res.redirect("/petition");
                        });
                    })
                    .catch(err => {
                        console.log("Error while signing in", err);
                        res.render("registration");
                    });
            });
        }
    });
});

//////////////////////////////////////////////
////////////// additional information ////////
//////////////////////////////////////////////

app.get("/additionalInformation", (req, res) => {
    db.userProfiles();
    res.render("additionalInformation");
});

app.post("/additionalInformation", (req, res) => {
    db.userProfiles(req.body.age, req.body.city, req.body.url).then(user => {
        res.redirect("/petition");
    });
});

////////////////////////////////////////////
/////////////// petition ///////////////////
////////////////////////////////////////////

app.get("/petition", (req, res) => {
    db.userProfiles();
    res.render("petition");
});

function checkForSig(req, res, next) {
    !req.session.signatureId ? res.redirect("/petition") : next();
}

////////////////////////////////////////////
/////////////// thanks /////////////////////
////////////////////////////////////////////

app.get("/thanks", checkForSig, (req, res) => {
    res.render("thanks");
});

app.post("/petition", (req, res) => {
    console.log(req.body.signature);
    db.insertUser(req.body.signature)
        .then(queryResults => {
            console.log(queryResults);
            // req.session.signatureId;
            res.render("thanks", {
                id: queryResults
            });
        })
        .catch(err => {
            console.log(err);
        });
});

//////////////////////////////////////////////////
/////////////// participants /////////////////////
//////////////////////////////////////////////////

app.get("/participants", (req, res) => {
    db.getSigners().then(users => {
        res.render("participants", {
            listOfParticipants: users
        });
    });
});

app.get("/signers/:cityname", (req, res) => {
    db.getSignersByCity(req.params.cityname);
});

app.listen(8080, () => {
    console.log("Listening on port 8080");
});
