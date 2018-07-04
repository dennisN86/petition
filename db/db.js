const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:dennis:password@localhost:5432/petition");

exports.insertUser = function(firstName, lastName, signature) {
    const query = `INSERT INTO signatures (first_name, last_name, signature)
    VALUES ($1, $2, $3)
    RETURNING *`;

    const params = [firstName, lastName, signature];

    return db.query(query, params).then(results => {
        return results.rows[0];
    });
};

exports.getSigners = function() {
    db.query("SELECT * FROM signatures;").then(results => {
        console.log(results.rows);
    });
};