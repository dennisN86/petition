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

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

//
app.use((req, res, next) => {
    req.session.user ? (res.locals.logged = true) : (res.locals.logged = false);
    next();
});

function checkForLog(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

function checkForSig(req, res, next) {
    console.log("function checkForSig triggered");
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        db.signatureId(req.session.user.id).then(result => {
            if (result) {
                console.log("signed");
                if (req.url === "/petition") {
                    console.log("redirect");
                    res.redirect("/thanks");
                } else {
                    next();
                }
            } else {
                if (req.url !== "/petition") {
                    res.redirect("/petition");
                } else {
                    next();
                }
            }
        });
    }
}

/////////////////////////////////////////
//////////// homepage ///////////////////
/////////////////////////////////////////

app.get("/", (req, res) => {
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
            )
                .then(newUser => {
                    req.session.user = newUser;
                    res.redirect("/profile");
                    console.log(newUser);
                })
                .catch(err => {
                    console.log(err);
                    res.render("registration", {
                        errorFlag: true,
                        err: "Oops, something went wrong!"
                    });
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
                                            console.log(req.session);
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

app.get("/profile", checkForLog, (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    db.userProfiles(
        req.body.age,
        req.body.city,
        req.body.url,
        req.session.user.id
    )
        .then(() => {
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.render("profile", {
                errorFlag: true,
                err: "Oops, something went wrong!"
            });
        });
});

////////////////////////////////////////////
/////////////// petition ///////////////////
////////////////////////////////////////////

app.get("/petition", checkForSig, (req, res) => {
    res.render("petition");
});

app.post("/petition", (req, res) => {
    db.insertUser(req.session.user.id, req.body.signature)
        .then(() => {
            console.log("signed bloody petition");
            res.redirect("/thanks");
        })
        .catch(err => {
            console.log(err);
            res.render("petition", {
                errorFlag: true,
                err: "Oops, something went wrong!"
            });
        });
});

////////////////////////////////////////////
/////////////// thanks /////////////////////
////////////////////////////////////////////

app.get("/thanks", checkForSig, (req, res) => {
    db.signatureId(req.session.user.id).then(results => {
        res.render("thanks", {
            signature: results.signature
        });
    });
});

app.post("/thanks", (req, res) => {
    db.removeSignature(req.session.user.id)
        .then(() => {
            console.log("removed");
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.render("thanks", {
                errorFlag: true,
                err: "Oops, something went wrong!"
            });
        });
});

//////////////////////////////////////////////////
/////////////// participants /////////////////////
//////////////////////////////////////////////////

app.get("/participants", checkForSig, (req, res) => {
    db.mergeTables().then(users => {
        res.render("participants", {
            listOfParticipants: users
        });
    });
});

app.get("/participants/:city", checkForSig, (req, res) => {
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

app.get("/editProfile", checkForLog, (req, res) => {
    db.getUserInfo(req.session.user.id).then(userData => {
        res.render("editProfile", {
            userData: userData
        });
    });
});

app.post("/editProfile", (req, res) => {
    if (!req.body.password == "") {
        bc.hashPassword(req.body.password)
            .then(results => {
                db.updateUsers(
                    req.session.user.id,
                    req.body.firstname,
                    req.body.lastname,
                    req.body.emailaddress
                ).then(() => {
                    db.updateUserProfile(
                        req.session.user.id,
                        req.body.age,
                        req.body.city,
                        req.body.url
                    ).then(() => {
                        db.updatePassword(results, req.session.user.id).then(
                            () => {
                                res.redirect("/editProfile");
                            }
                        );
                    });
                });
            })
            .catch(err => {
                console.log(err);
                res.render("editProfile", {
                    errorFlag: true,
                    err: "Oops, something went wrong!"
                });
            });
    } else {
        db.updateUsers(
            req.session.user.id,
            req.body.firstname,
            req.body.lastname,
            req.body.emailaddress
        ).then(() => {
            db.updateUserProfile(
                req.session.user.id,
                req.body.age,
                req.body.city,
                req.body.url
            )
                .then(() => {
                    res.redirect("/editProfile");
                })
                .catch(err => {
                    console.log(err);
                    res.render("editProfile", {
                        errorFlag: true,
                        err: "Oops, something went wrong!"
                    });
                });
        });
    }
});

//////////////////////////////////////////////////
///////////////// logout /////////////////////////
//////////////////////////////////////////////////

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/registration");
});

app.listen(8080, () => {
    console.log("Listening on port 8080");
});
