CREATE TABLE  user_table (id text, name text);
ALTER TABLE user_table ADD CONSTRAINT unique_mid PRIMARY KEY (id);
CREATE TABLE  special_product_table (product_info json);
