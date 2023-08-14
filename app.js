/*
  This code block checks if the current environment is not "production" and if so,
  loads environment variables from a .env file into process.env using the dotenv package.
  It is commonly used in development environments to avoid hardcoding sensitive information such as API keys etc.
  In our case its for a Session Key
*/
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const flash = require('express-flash')
const methodOverride = require('method-override')
const fs = require('fs');
const markdownIt = require('markdown-it');
const md = new markdownIt();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

//As this application is a proof of concept the users will be stored locally.
//In a real situation this would be a database such as MongoDB
const users = [{
  id: '1691545327495',
  name: 'Peter Kemley',
  email: 'e@e',
  password: '$2b$10$B7jDFgnkHCC6ouahBVWX8.okyf8c6sUFA1Wo2RPre19/.ihKiHKgO'
}
];

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// Set up the layout file
app.set('layout', 'layout');
app.use(expressLayouts);

// Custom middleware to set the currentPage variable
app.use((req, res, next) => {
  res.locals.currentPage = req.path;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

//checkAuthenticated and checkNotAuthenticated are two functions used to check if a user is logged in or not
function checkAuthenticated(req, res, next) {
  //IF USER IS AUTHENTICATED(LOGGED IN) THEN PROCEED ELSE REDIRECT TO LOGIN PAGE
  if (req.isAuthenticated()) {
    return next()
  }
  console.log('User Not Logged In')
  // Set a flash message to indicate the error
  req.flash('error', 'You must be logged in to access this page.');
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  //IF USER IS NOT AUTHENTICATED(LOGGED IN) THEN REDIRECT TO HOME ELSE PROCEED
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.get('/', (req, res) => {
  console.log('Confirm GET REQUEST for Homepage');
  
  if (req.isAuthenticated()) {
    // If the user is authenticated, render the welcome message
    res.render('home', { title: 'Home', message: `Hello <strong>${req.user.name}</strong>, Welcome back!` });
  } else {
    // If the user is not authenticated, render the "Get Started Now" message
    res.render('home', { title: 'Home', message: 'Hey we see you are not logged in to access our APIs section you must register so why not!' });
  }
});

// Login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Login');
  res.render('login.ejs', { title: 'Login' })
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err); // Handle the error if it occurs
    }
    res.redirect('/login'); // Redirect after successful logout
  });
});

// Register route
app.get('/register', checkNotAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Register');
  res.render('register', { title: 'Register' });
});

// POST request for user registration
app.post('/register', checkNotAuthenticated, async (req, res) => {
  console.log('Confirm POST REQUEST for Register');
  
  const { name, email, password, confirmPassword } = req.body;
  console.log(req.body);
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return res.render('register', { title: 'Register', Error: 'Passwords do not match. Please try again.' });
    }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword
    });
    res.redirect('/login');
    console.log(`User Registered Successfully`);
  } catch {
    console.log('User Registered Unsuccessfully please try again');
    res.redirect('/register');
  }
  console.log(users);
});

// About route
app.get('/about', (req, res) => {
  console.log('Confirm GET REQUEST for About');
  res.render('about', { title: 'About Us' });
});

// Scanner route
app.get('/scanner', checkAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Scanner API');
  res.render('scanner', { title: 'Scanner API' });
});

// Scanner POST
app.post('/api/scanner', async (req, res) => {
  const barcode = req.body.barcode; // Assuming the barcode is sent in the request body

  // Make the API request to VeganCheck API using the Fetch API or Axios (you can choose either)
  // For example, using the Fetch API
  try {
    const apiUrl = `https://api.vegancheck.me/v0/product/${barcode}`;
    const response = await fetch(apiUrl, { method: "POST" });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'An error occurred while fetching data from VeganCheck API' });
  }
});

// Route for Ingredients view
app.get('/ingredient', checkAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Ingredients API');
  res.render('ingredient', { title: 'Ingredient API' });
});

// Contact route ----------------------------------ANYTHING BETWEEN THIS AND THE NEXT LONG ASS LINE IS TODO WITH CONTACT PAGE----------------------------------
app.get('/contact', (req, res) => {
  console.log('Confirm GET REQUEST for Contact');
  res.render('contact' , { title: 'Contact Us' });
});

// Handle POST request for the contact form
app.post('/contact', async (req, res) => {
  console.log('Confirm POST REQUEST for Contact');
  const { name, email, message } = req.body;
  //DEBUG DATA
  console.log('Received form data:');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Message:', message);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender's email
      to: process.env.EMAIL_RECIPIENT, // Recipient's email
      subject: `Contact Form Submission from ${name}`,
      text: `Message from ${email}:\n\n${message}`,
      replyTo: email,
    });
    console.log("Email Sent to Web App Inbox!");
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender's email
      to: email, // Recipient's email
      subject: `Contact Form Submission from ${name}`,
      text: `Thank you for your message ${name}, We look forward to reading your email!`,
    });
    console.log("Email Sent to " + email + "Inbox!");
    // Store the thank you message in session and redirect
    req.flash('thankyoumessage', `Thank you for contacting us, ${name}! We'll get back to you soon.`);
    res.redirect('/contact');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('An error occurred while sending the email.');
  }
});

//INFORMATION NAVBAR DROPDOWN GET REQUESTS
app.get('/diet', (req, res) => {
  console.log('Confirm GET REQUEST for Diet Information');
  res.render('diet', { title: 'Diet Information' });
});

app.get('/allergen', (req, res) => {
  console.log('Confirm GET REQUEST for Allergen Information');
  res.render('allergen', { title: 'Allergen Information' });
});

app.get('/allergen-risks', (req, res) => {
  console.log('Confirm GET REQUEST for Allergen Information');
  res.render('allergen-risks', { title: 'Allergen Risks' });
});

app.get('/api-info', (req, res) => {
  console.log('Confirm GET REQUEST for API Information');
  res.render('api-info', { title: 'API Information' });
});

app.get('/readme', (req, res) => {
  console.log('Confirm GET REQUEST for README.MD FILE');
  // Read the content of the README.md file
  fs.readFile('./README.md', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading README.md:', err);
      return res.status(500).send('Error reading README.md');
    }

    // Convert Markdown to HTML using the markdown-it module
    const readmeHTML = md.render(data);

    // Render the readme.ejs view with the converted HTML content
    res.render('readme', { title: 'README File', readmeHTML });
  });
});

//IF RUNNING LOCALHOST PORT WILL BE 3000 but if hosted it will be the env variable AUTO SET BY HEROKU
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});