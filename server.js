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
        res.render("registration", {
            errorFlag: true,
            err: "Some error occured! Please fill in the form again."
        });
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
                                        errorFlag: true,
                                        err: "Password incorrect!"
                                    });
                                }
                            })
                            .catch(err => {
                                console.log(err);
                                res.render("login", {
                                    errorFlag: true,
                                    err:
                                        "Some error occured! Please fill in the form again."
                                });
                            });
                    }
                );
            }
        })
        .catch(err => {
            console.log(err);
            res.render("login", {
                errorFlag: true,
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
        req.body.age,
        req.body.city,
        req.body.url,
        req.session.user.id
    ).then(results => {
        console.log(results);
        res.redirect("/petition");
    });
});

////////////////////////////////////////////
/////////////// petition ///////////////////
////////////////////////////////////////////

app.get("/petition", checkForSig, (req, res) => {
    res.render("petition");
});

function checkForSig(req, res, next) {
    console.log("checking for signature");
    req.session.signatureId ? res.redirect("/thanks") : next();
}

////////////////////////////////////////////
/////////////// thanks /////////////////////
////////////////////////////////////////////

app.get("/thanks", (req, res) => {
    db.signatureId(req.session.signatureId).then(results => {
        res.render("thanks", {
            signature: results
        });
    });
});

app.post("/petition", (req, res) => {
    db.insertUser(req.session.user.id, req.body.signature)
        .then(signatureId => {
            req.session.signatureId = signatureId;
            res.redirect("/thanks");
        })
        .catch(err => {
            console.log(err);
        });
});

//////////////////////////////////////////////////
/////////////// participants /////////////////////
//////////////////////////////////////////////////

app.get("/participants", (req, res) => {
    db.mergeTables().then(users => {
        res.render("participants", {
            listOfParticipants: users
        });
    });
});

app.get("/participants/:city", (req, res) => {
    db.listCity(req.params.city.toUpperCase()).then(results => {
        res.render("city", {
            listOfParticipants: results,
            city: req.params.city.toUpperCase()
        });
    });
});

//////////////////////////////////////////////////
/////////////// edit profile /////////////////////
//////////////////////////////////////////////////

app.get("/editProfile", (req, res) => {
    console.log(req.session.user.id);
    db.getUserInfo(req.session.user.id).then(results => {
        console.log(results);
        req.session.firstname = results.first_name;
        req.session.lastname = results.last_name;
        req.session.email = results.email;
        req.session.hashedPassword = results.hashed_password;
        req.session.age = results.age;
        req.session.city = results.city;
        req.session.url = results.url;
        res.render("editProfile", {
            userData: results
        });
    });
});

app.post("/editProfile", (req, res) => {
    if (
        req.body.firstname == "" &&
        req.body.lastname == "" &&
        req.body.email == "" &&
        req.body.password == "" &&
        req.body.age == "" &&
        req.body.city == "" &&
        req.body.url == ""
    ) {
        res.redirect("/petition");
    } else {
        if (!req.body.firstname == "") {
            req.session.firstname = req.body.firstname;
        }
        if (!req.body.lastname == "") {
            req.session.lastname = req.body.lastname;
        }
        if (!req.body.email == "") {
            req.session.email = req.body.email;
        }
        if (!req.body.age == "") {
            req.session.age = req.body.age;
        }
        if (!req.body.city == "") {
            req.session.city = req.body.city;
        }
        if (!req.body.url == "") {
            req.session.url = req.body.url;
        }
        if (!req.body.password == "") {
            bc.hashPassword(req.body.password)
                .then(result => {
                    req.session.hashedPassword = result;
                })
                .then(() => {
                    db.updateUsers(
                        req.session.userId,
                        req.session.firstname,
                        req.session.lastname,
                        req.session.email,
                        req.session.hashedPassword
                    ).then(() => {
                        db.updateUserProfile(
                            req.session.userId,
                            req.session.age,
                            req.session.city,
                            req.session.url
                        ).then(() => {
                            res.redirect("/editProfile");
                        });
                    });
                });
        } else {
            db.updateUsers(
                req.session.userId,
                req.session.firstname,
                req.session.lastname,
                req.session.email,
                req.session.hashedPassword
            ).then(() => {
                db.updateUserProfile(
                    req.session.userId,
                    req.session.age,
                    req.session.city,
                    req.session.url
                ).then(() => {
                    res.redirect("/editProfile");
                });
            });
        }
    }
});

//////////////////////////////////////////////////
///////////////// logout /////////////////////////
//////////////////////////////////////////////////

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
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
