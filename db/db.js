const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:dennis:password@localhost:5432/petition");

exports.registerUser = function(firstName, lastName, emailAddress, password) {
    const queryRegistration = `INSERT INTO users (first_name, last_name, email, hashed_password)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;

    const options = [firstName, lastName, emailAddress, password];

    return db
        .query(queryRegistration, options)
        .then(results => {
            return results.rows[0];
        })
        .catch(err => {
            console.log("Error from registration", err);
            // return
        });
};

exports.getUser = function(email) {
    const query = `SELECT id, first_name, last_name, email FROM users WHERE email = $1;`;

    const options = [email];

    return db.query(query, options).then(results => {
        return results.rows[0];
    });
};

exports.insertUser = function(signature) {
    const query = `INSERT INTO signatures (signature)
    VALUES ($1)
    RETURNING *`;

    const options = [signature];

    return db.query(query, options).then(results => {
        return results.rows[0].signature;
    });
};

exports.registration = function() {
    return db.query("SELECT * FROM users;").then(results => {
        return results.rows;
    });
};

exports.getPassword = function(email) {
    const options = [email];
    return db
        .query("SELECT hashed_password FROM users WHERE email = $1;", options)
        .then(results => {
            return results.rows[0].hashed_password;
        });
};

exports.getEmails = function(email) {
    const options = [email];
    return db
        .query("SELECT * FROM users WHERE email = $1;", options)
        .then(results => {
            return results.rows[0];
        });
};

exports.userProfiles = function(age, city, url) {
    const query = `INSERT INTO user_profiles (age, city, url)
    VALUES ($1, $2, $3)
    RETURNING *`;

    const params = [age, city, url];

    return db.query("SELECT * FROM user_profiles;").then(results => {
        return results.rows;
    });
};

exports.getSigners = function() {
    return db.query("SELECT * FROM signatures;").then(results => {
        return results.rows;
    });
};

exports.signatureId = function(sigId) {
    const q = `SELECT signature FROM signatures WHERE id = $1`;
    const params = [sigId];

    return db.query(q, params).then(results => {
        return results.rows[0].signature;
    });
};
