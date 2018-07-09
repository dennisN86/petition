DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    age VARCHAR(50),
    city VARCHAR(50),
    url VARCHAR(100),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
