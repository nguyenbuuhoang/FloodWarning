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

// Set the interval to 10 minutes
setInterval(() => {
  const moment = require('moment-timezone');
  const timeString = moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
  const dateString = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
  

  // Add the data to the "history" node in Firebase Realtime Database
  const historyRef = db.ref('history');
  historyRef.push({
    distance: distance,
    temperature: temperature,
    humidity: humidity,
    average: average,
    warning: warning,
    time: timeString,
    date: dateString
  }, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Saved data to Firebase Realtime Database');
    }
  });
  if (warning === 3) {
    // Get a list of all users with registered email addresses
    const usersRef = db.ref('users');
    usersRef.orderByChild('email').on('value', (snapshot) => {
      const users = snapshot.val();
      // Send email notification to each user
      Object.keys(users).forEach((userId) => {
        const user = users[userId];
        if (user.email) {
          sendEmail(user.email, 'cảnh báo',`Chào ${user.username},
Mực nước đang ở mức báo động, cảnh báo đang ở mức level ${warning},
Khoảng cách hiện tại ${average} cm, bạn cần di tản gấp
Thời điểm ghi nhận  ${timeString},ngày ${dateString}`);
        }
      });
    });
  }
// Create a transporter to send emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'floodwarning1105@gmail.com',
    pass: 'glhpwnprnxnclvzc'
  }
});
function sendEmail(to, subject, text) {
  const mailOptions = {
    from: 'floodwarning1105@gmail.com',
    to,
    subject,
    text
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}
},60 *10 * 1000);

// Route for homepage
app.get('/', (req, res) => {
  const user = req.session.user;
  const username = user?.username;
  res.render('home', { username });
});


// Route for introducing page
app.get('/gioithieu', requireAuth, (req, res) => {
  const user = req.session.user;
  const username = user.username;
  res.render('gioithieu', { username });
});

// Route for chart page
app.get('/charts', requireAuth, (req, res) => {
  const user = req.session.user;
  const username = user.username;
  res.render('charts', { username });
});
// Route for chart data
app.get('/charts-data', (req, res) => {
  const historyRef = db.ref('history');

  // Get the data from Firebase Realtime Database
  historyRef.once('value', (snapshot) => {
    const data = snapshot.val();
    res.json(data);
  });
});


// Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.urlencoded({ extended: true }));
// Route for registration form
app.get('/dangky', (req, res) => {
  res.render('dangky');
});
// Route for handling registration form submission

app.post('/dangky', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    // Check if username already exists in Firebase Realtime Database
    const ref = db.ref('users');
    const snapshot = await ref.orderByChild('username').equalTo(username).once('value');
    const emailSnapshot = await ref.orderByChild('email').equalTo(email).once('value');
    if (snapshot.exists() && emailSnapshot.exists()) {
      res.send({ success: false, message: 'Tên đăng nhập và Email đã được đăng ký' });
    } else if (snapshot.exists()) {
      res.send({ success: false, message: 'Tên đăng nhập đã được đăng ký' });
    } else if (emailSnapshot.exists()) {
      res.send({ success: false, message: 'Email đã được đăng ký' });
    }
    else {
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create new user in Firebase Realtime Database
      const userRef = ref.push({
        username,
        email,
        password: hashedPassword // Store hashed password in database
      });
      console.log(`User ${username} with ID ${userRef.key} created`);
      res.send({ success: true, message: 'Đăng ký thành công' });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.send({ success: false, message: 'Lỗi đăng ký' });
  }
});




// Route for login form
app.get('/dangnhap', (req, res) => {
  res.render('dangnhap');
});

// Route for handling login form submission
app.post('/dangnhap', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Check if username exists in Firebase Realtime Database
    const ref = db.ref('users');
    const snapshot = await ref.orderByChild('username').equalTo(username).once('value');
    if (snapshot.exists()) {
      const user = snapshot.val()[Object.keys(snapshot.val())[0]]; // Get the first user with matching username
      // Compare hashed password with entered password using bcrypt
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        console.log(`User ${username} logged in`);
        req.session.user = { id: user.id, username: user.username };
        res.send({ success: true, message: 'Đăng nhập thành công' }); // send response as JSON
      } else {
        res.send({ success: false, message: 'Mật khẩu không chính xác' });
      }
    } else {
      res.send({ success: false, message: 'Người dùng không tồn tại' });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    res.send({ success: false, message: 'Error logging in user' });
  }
});




// Route for logout button
app.get('/logout', (req, res) => {
  // Delete session users
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    } else {
      // homepage
      res.redirect('/');
    }
  });
});


// Route for history page
app.get('/history', requireAuth, (req, res) => {
  const historyRef = db.ref('history');
  historyRef.once('value', (snapshot) => {
    const historyData = snapshot.val();
    const user = req.session.user;
    const username = user?.username;
    res.render('history', { historyData, username: username });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});