const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:dennis:password@localhost:5432/petition");

exports.registerUser = function(firstName, lastName, emailAddress, password) {
    const queryRegistration = `INSERT INTO users (first_name, last_name, email, hashed_password)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;

    const options = [firstName, lastName, emailAddress, password];

    return db.query(queryRegistration, options).then(results => {
        return results.rows[0];
    });
};

exports.getUser = function(email) {
    const query = `SELECT id, first_name, last_name, email FROM users WHERE email = $1;`;

    const options = [email];

    return db.query(query, options).then(results => {
        return results.rows[0];
    });
};

exports.insertUser = function(userId, signature) {
    const query = `INSERT INTO signatures (user_id, signature)
    VALUES ($1, $2)
    RETURNING *`;

    const options = [userId, signature];

    return db.query(query, options).then(results => {
        return results.rows[0].id;
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

exports.userProfiles = function(age, city, url, userId) {
    const query = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;

    const options = [age, city, url, userId];

    return db.query(query, options).then(results => {
        return results.rows[0];
    });
};

exports.getSigners = function() {
    return db.query("SELECT * FROM signatures;").then(results => {
        return results.rows[0];
    });
};

exports.signatureId = function(sigId) {
    const query = `SELECT signature FROM signatures WHERE id = $1`;
    const options = [sigId];

    return db.query(query, options).then(results => {
        return results.rows[0].signature;
    });
};

exports.mergeTables = function() {
    const query = `SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM users
    JOIN user_profiles ON user_profiles.user_id = users.id`;

    return db.query(query).then(results => {
        return results.rows;
    });
};
