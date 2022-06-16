// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');

const webPush = require('web-push');
const path = require('path')
const publicVapidKeys = "BLVzOEK7jshkP7485nAMi-c19MSfj06WayQStA_rRPg94G-IxhKzPM_zoyRU13kdjaWB5JoGoRHoJQ9e42DPHVE";
const privateVapidKeys = "pqWCmaasnf131Egh4L4hNq3oujU8I03G00pLveduUD4";

webPush.setVapidDetails('mailto:test@test.com', publicVapidKeys, privateVapidKeys)


var app      = express();
const server = require("http").Server(app)
//socket id lets us communicate live between computers to get chat/videochat to render. it is only visual. Doesnt save anything to db.
const io = require("socket.io")(server)
//uuid creates a unique id for each user and chat room so users/rooms are not confused between each other
const {v4: uuidV4} = require("uuid")
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
var port     = process.env.PORT || 8080;
const MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var db

// configuration ===============================================================
mongoose.connect(configDB.url, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, passport, db, uuidV4);
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use('/peerjs', peerServer);
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'rcbootcamp2021b', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log("room id:", roomId, "|","user id:", userId)
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})


server.listen(port);
console.log(`http://localhost:${port}/`);
