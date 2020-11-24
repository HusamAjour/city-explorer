DROP TABLE IF EXISTS location;
CREATE TABLE IF NOT EXISTS location(
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)
);