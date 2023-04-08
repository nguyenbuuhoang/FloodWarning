const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const exphbs = require('express-handlebars');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const serviceAccount = require('./firebase-adminsdk.json');
const session = require('express-session');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./localStorage');
// Middleware for checking authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/dangnhap');
  } else {
    next();
  }
};
app.use(session({
  secret: 'session',
  resave: false,
  saveUninitialized: true
}));
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://canhbaoluiot-default-rtdb.firebaseio.com/"
});

// Set up Handlebars view engine
app.engine('handlebars', exphbs({
  defaultLayout: null
}));
app.set('view engine', 'handlebars');

// Set up static files
app.use(express.static('public'));


// Get a database reference
const db = admin.database();
const ref = db.ref('IoT');

// Declare global variables
let distance, temperature, humidity, average, warning;

// Listen for value changes in Firebase Realtime Database
ref.on('value', (snapshot) => {
  const data = snapshot.val();
  const now = new Date().toISOString();

  // Extract values from the snapshot
  distance = data.Khoang_cach;
  temperature = data.Nhiet_do;
  humidity = data.Do_am;
  average = data.Trung_binh;
  warning = data.Muc_canh_bao;

  // Send values to all connected clients
  io.emit('data', { distance, temperature, humidity, average, warning });
});


// Route for homepage
app.get('/', (req, res) => {
  const user = req.session.user;
  const username = user?.username;
  res.render('home', { username });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
