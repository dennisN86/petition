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
                res.redirect("/profile");
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
    db.getEmails(req.body.emailaddress)
        .then(results => {
            if (results && results.email) {
                db.getPassword(req.body.emailaddress).then(
                    savedHashedPassword => {
                        bc.checkPassword(req.body.password, savedHashedPassword)
                            .then(doesMatch => {
                                if (doesMatch) {
                                    db.getUser(req.body.emailaddress).then(
                                        matchedUser => {
                                            req.session.user = matchedUser;
                                            res.redirect("/petition");
                                        }
                                    );
                                } else {
                                    res.render("login", {
                                        err:
                                            "Some error occured! Please fill in the form again."
                                    });
                                }
                            })
                            .catch(err => {
                                res.render("login", {
                                    err:
                                        "Some error occured! Please fill in the form again."
                                });
                            });
                    }
                );
            }
        })
        .catch(err => {
            res.render("login", {
                err: "Some error occured! Please fill in the form again."
            });
        });
});

//////////////////////////////////////////////
/////////////////// profil ///////////////////
//////////////////////////////////////////////

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    db.userProfiles(
        req.session.user.id,
        req.body.age,
        req.body.city,
        req.body.url
    ).then(results => {
        console.log(results);
        res.redirect("/petition");
    });
});

////////////////////////////////////////////
/////////////// petition ///////////////////
////////////////////////////////////////////

app.get("/petition", (req, res) => {
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
    db.insertUser(req.session.user.id, req.body.signature)
        .then(queryResults => {
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

// populate edit profile page with user credentials, except password and homepage field
// write to querries to update the user and the user_profiles table
// the column your checking the ON CONFLICT (name) has to be the UNIQUE thingy
//
// when password is an empty sting -> skipping password update = no new hash
// redirect user to updated information
// add delete button to signature -> set the signature in the session to null
