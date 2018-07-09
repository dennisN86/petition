DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY, -- SERIAL autogenerates the id
    user_id INTEGER,
    signature TEXT NOT NULL,
    signed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
