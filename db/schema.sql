DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY, -- SERIAL autogenerates the id
    user_id INTEGER NOT NULL REFERENCES users(id),
    signature TEXT NOT NULL,
    signed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
