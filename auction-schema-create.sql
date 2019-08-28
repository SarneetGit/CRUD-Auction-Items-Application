DROP DATABASE IF EXISTS auction_db;

CREATE DATABASE auction_db;

USE auction_db;

CREATE TABLE item (
  id INT NOT NULL AUTO_INCREMENT,
  item_name VARCHAR(45) NULL,
  date_added datetime default current_timestamp,
  PRIMARY KEY (id)
);

INSERT INTO item (item_name)
VALUES ("Statue");

INSERT INTO item (item_name)
VALUES ("Painting");

INSERT INTO item (item_name)
VALUES ("Signed");

CREATE TABLE bid (
  id INT NOT NULL AUTO_INCREMENT,
  item_id INT NOT NULL,
  price INT NOT NULL,
  date_added datetime default current_timestamp,
  PRIMARY KEY (id)
);

INSERT INTO bid (item_id, price) VALUES (1, 50);

CREATE TABLE userpass (
  id INT NOT NULL AUTO_INCREMENT,
  username INT NOT NULL,
  pw INT NOT NULL,
  date_added datetime default current_timestamp,
  PRIMARY KEY (id)
);

