'use strict';

const express = require('express');
require('dotenv').config();
const server = express();
const superagent = require('superagent');
// cors added
const cors = require('cors');
server.use(cors());


const PORT = process.env.PORT;

server.get('/', (req, res) => {
  res.send('Homepage');
});

server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/trails', trailHandler);

function locationHandler(req, res){
  let cityName = req.query.city;
  let locationToken =  `pk.c3cccc1f05ffea1586881cfdeb87264e`;
  let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${cityName}&format=json`;

  superagent.get(url)
    .then(data => {
      const locationObject = new Location(cityName, data.body);
      res.status(200).send(locationObject);
    })
    .catch(()=> {
      errorHandler('Location .. Something went wrong!!', req, res);
    });
}

function weatherHandler(req, res){
  let cityName = req.query.search_query;
  let cityLat = req.query.lat;
  let cityLon = req.query.lon;

  console.log(req.query);
  let weatherKey = `116662ee2d234baea33ed4f37c7f052c`;
  //let weatherKey = process.env.WEATHER_API_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}&days=8&lat=${cityLat}&lon=${cityLon}`;
  superagent.get(url)
    .then(weatehrData => {
      let weatherObjcts =  weatehrData.body.data.map( w => {
        let weatherObject = new Weather(w);
        return weatherObject;
      });
      res.status(200).json(weatherObjcts);
    })
    .catch(()=> {
      errorHandler('Weather .. Something went wrong!!', req, res);
    });
}


function trailHandler(req, res){
  let trailLat = req.query.latitude;
  let trailLon = req.query.longitude;
  let trailsKey = `200980371-764eb44b99ea596012a66a030b3c7645`;
  // let trailsKey = process.env.TRAIL_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${trailLat}&lon=${trailLon}&maxDistance=10&key=${trailsKey}`;

  superagent.get(url)
    .then(tarilsData => {
      console.log(JSON.parse(tarilsData.text).trails);
      let trailObjects = JSON.parse(tarilsData.text).trails.map( t => {
        let trail = new Trail(t);
        return trail;
      });
      res.status(200).json(trailObjects);
    })
    .catch(() => {
      errorHandler('Trails .. Something went wrong!!', req, res);
    });
}

function errorHandler(error, req, res) {
  res.status(500).send(error);
}

function Location(city, locationData){
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

function Weather(weatehrData){
  this.forecast = weatehrData.weather.description;
  this.time = weatehrData.datetime;
}
function Trail(trailData){
  this.name = trailData.name;
  this.location = trailData.location;
  this.length = trailData.length;
  this.stars = trailData.stars;
  this.star_votes = trailData.starVotes;
  this.summary = trailData.summary;
  this.trail_url = trailData.url;
  this. conditions = trailData.conditionStatus;
  this.condition_date = trailData.conditionDate.split(' ')[0];
  this.condition_time = trailData.conditionDate.split(' ')[1];
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


