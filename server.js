'use strict';

const express = require('express');
require('dotenv').config();
const server = express();

const PORT = process.env.PORT || 3030;

server.get('/', (req, res) => {
  res.send('Welcome to City Explorer');
});
server.get('/location', (req, res) => {
  const locationData = require('./data/location.json');
  const locationObject = new Location('Lynnwood' , locationData);
  res.send(locationObject);
});

server.get('/weather', (req, res) => {
  const weatehrData = require('./data/weather.json');
  weatehrData.data.forEach((w) => {
    let weatherObject = new Weather(w);
  });
  res.send(Weather.all);
});

function Location(city, locationData){
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longtitude = locationData[0].lon;
}
Weather.all = [];
function Weather(weatehrData){
  this.forecast = weatehrData.weather.description;
  this.time = weatehrData.valid_date;
  Weather.all.push(this);
}

server.get('*', (req, res) => {
  res.status(400).send('Not found');
});
server.use((error, req, res) => {
  res.status(500).send('Sorry, something went wrong');
});

server.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT}`);
});
