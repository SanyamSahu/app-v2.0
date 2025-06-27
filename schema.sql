CREATE TABLE user_login_credentials (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL
);

CREATE TABLE user_details (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    address VARCHAR(255),
    accounts JSON
);

CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY,
    accountNumber VARCHAR(255) NOT NULL,
    holderName VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    FOREIGN KEY (userId) REFERENCES user_login_credentials(id)
);

CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    currency VARCHAR(10) NOT NULL,
    accountId VARCHAR(255) NOT NULL,
    FOREIGN KEY (accountId) REFERENCES accounts(id)
);W