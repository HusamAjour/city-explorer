'use strict';

const express = require('express');
require('dotenv').config();
const server = express();
const pg = require('pg');
const client  = new pg.Client(process.env.DATABASE_URL);
const superagent = require('superagent');
const yelp = require('yelp-fusion');
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
server.get('/movies', movieHandler);
server.get('/yelp', yelpHandler);

function locationHandler(req, res){

  let cityName = req.query.city;
  let locationToken =  process.env.GEO_API_KEY;
  let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${cityName}&format=json`;

  let SQL = `SELECT search_query, formatted_query, latitude, longitude FROM location WHERE search_query = '${cityName}'`;
  client.query(SQL)
    .then(result => {
      if(result.rowCount !== 0){
        console.log(result);
        res.status(200).json(result.rows[0]);
      }else if(result.rowCount === 0){
        console.log('inside else');
        callLocationAPI(url, cityName)
          .then(locData => {
            console.log(locData);
            res.status(200).json(locData);
          });
        console.log('after callback function');
      }
    })
    .catch(error=>errorHandler(error, req, res));

  /*superagent.get(url)
    .then(data => {
      const locationObject = new Location(cityName, data.body);
      res.status(200).send(locationObject);
    })
    .catch(()=> {
      errorHandler('Location .. Something went wrong!!', req, res);
    });*/
}
function callLocationAPI(url, cityName){
  return superagent.get(url)
    .then(data => {
      console.log('inside callback function');
      const locationObject = new Location(cityName, data.body);
      let insertSQL = `INSERT INTO location (search_query,formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4)`;
      let safeValues = [locationObject.search_query,locationObject.formatted_query, locationObject.latitude,locationObject.longitude];
      client.query(insertSQL,safeValues)
        .then (() =>{
          console.log('your data has been added successfully!!');
        });
      console.log(locationObject);
      return locationObject;
    });
}
function weatherHandler(req, res){
  let cityName = req.query.search_query;
  let cityLat = req.query.lat;
  let cityLon = req.query.lon;

  console.log(req.query);
  let weatherKey = process.env.WEATHER_API_KEY;
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
  let trailsKey = process.env.TRAIL_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${trailLat}&lon=${trailLon}&maxDistance=10&key=${trailsKey}`;

  superagent.get(url)
    .then(tarilsData => {
      let trailObjects = tarilsData.body.trails.map( t => {
        let trail = new Trail(t);
        return trail;
      });
      res.status(200).json(trailObjects);
    })
    .catch(() => {
      errorHandler('Trails .. Something went wrong!!', req, res);
    });
}
function movieHandler(req, res){
  let cityName = req.query.search_query;
  let moviesKey = process.env.MOVIE_API_KEY;
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${moviesKey}&query=${cityName}`;

  superagent.get(url)
    .then(movieResults => {
      console.log(movieResults.body.results);
      let movieObjects = movieResults.body.results.map( m => {
        let movie = new Movie(m);
        return movie;
      });
      res.status(200).json(movieObjects);
    })
    .catch(()=>{
      errorHandler('Movies .. Something went wrong!!', req, res);
    });
}

function yelpHandler(req,res){
  let cityName = req.query.search_query;
  let page = req.query.page;
  const numberPerPages = 5;
  let start = ((page - 1) * numberPerPages + 1);
  let url = `https://api.yelp.com/v3/businesses/search?term="restaurants"&location="${cityName}"&limit=${numberPerPages}&offset=${start}`;
  let yelpKey = process.env.YELP_API_KEY;

  superagent.get(url)
    .set('Authorization', `Bearer ${yelpKey}`)
    .then(yelpData => {
      let yelpObjects = yelpData.body.businesses.map( y => {
        let yelp = new Yelp(y);
        return yelp;
      });
      res.status(200).json(yelpObjects);
    })
    .catch(()=>{
      errorHandler('Movies .. Something went wrong!!', req, res);
    });


/*
    const searchRequest = {
      term: 'restaurants',
      location: `'${cityName}'`,
    };
    const client = yelp.client(yelpKey);
    client.search(searchRequest)
    .then(yelpData => {
      console.log(yelpData.jsonBody.businesses);
      let yelpObjects = yelpData.jsonBody.businesses.map( y => {
        let yelp = new Yelp(y);
        return yelp;
      });
      res.status(200).json(yelpObjects);
    })
    .catch(()=>{
      errorHandler('Yelp .. Something went wrong!!', req, res);
    });*/
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

function Movie(movieData){
  this.title = movieData.title;
  this.overview = movieData.overview;
  this.average_votes= movieData.vote_average;
  this.total_votes= movieData.vote_count;
  this.image_url= `https://image.tmdb.org/t/p/w500/${movieData.poster_path}`;
  this.popularity = movieData.popularity;
  this.released_on = movieData. release_date;
}

function Yelp(yelpData){
  this.name = yelpData.name;
  this.image_url= yelpData.image_url;
  this.price = yelpData.price;
  this.rating = yelpData. rating;
  this.url = yelpData. url;
}
server.get('*', (req, res) => {
  res.status(400).send('Not found');
});
server.use((error, req, res) => {
  res.status(500).send('Sorry, something went wrong');
});


client.connect()
  .then(() => {
    server.listen(PORT, ()=>{
      console.log(`Listening on port ${PORT}`);
    });
  });
