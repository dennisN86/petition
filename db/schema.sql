CREATE TABLE signatures (
    id SERIAL PRIMARY KEY, -- SERIAL autogenerates the id
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    signatures TEXT NOT NULL
);
