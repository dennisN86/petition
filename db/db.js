const spicedPg = require("spiced-pg");
let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg("postgres:dennis:password@localhost:5432/petition");
}

// const db = spicedPg("postgres:dennis:password@localhost:5432/petition");

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

exports.listCity = city => {
    const options = [city];
    const query = `
       SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM users
           JOIN user_profiles ON user_profiles.user_id = users.id
       WHERE UPPER(user_profiles.city)=UPPER($1);
       `;
    return db.query(query, options).then(results => {
        return results.rows;
    });
};

exports.getUserInfo = function(userId) {
    const query = `SELECT users.first_name, users.last_name, users.email, users.hashed_password, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE users.id = $1;`;

    const options = [userId];

    return db.query(query, options).then(results => {
        return results.rows[0];
    });
};

exports.updateUsers = function(
    userId,
    firstName,
    lastName,
    email,
    hashedPassword
) {
    const query = `UPDATE users SET first_name = $2, last_name = $3, email = $4, hashed_password = $5
    WHERE id = $1
    RETURNING *;`;

    const options = [userId, firstName, lastName, email, hashedPassword];

    return db
        .query(query, options)
        .then(results => {
            return results.rows[0];
        })
        .catch(err => {
            console.log(err);
        });
};

exports.updateUserProfile = function(userId, age, city, url) {
    const query = `INSERT INTO user_profiles (user_id ,age, city, url)
    VALUES ($1 , $2 , $3 , $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $2 , city = $3 , url = $4;`;

    const options = [userId, age, city, url];

    return db
        .query(query, options)
        .then(results => {
            return results.rows[0];
        })
        .catch(err => {
            console.log(err);
        });
};
