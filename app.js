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

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

//As this application is a proof of concept the users will be stored locally.
//In a real situation this would be a database such as MongoDB
const users = [];

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
  next();
});

// Home route
app.get('/', (req, res) => {
  console.log('Confirm GET REQUEST for Homepage');
  res.render('home');
});

//IF userAuthenticated then render index and feed in Users name
app.get('/', checkAuthenticated, (req, res) => {
  res.render('home.ejs', { name: req.user.name })
})

// Login route
app.get('/login', checkNotAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Login');
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.delete("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Register route
app.get('/register', checkNotAuthenticated, (req, res) => {
  console.log('Confirm GET REQUEST for Register');
  res.render('register');
});

// POST request for user registration
app.post('/register', checkNotAuthenticated, async (req, res) => {
  console.log('Confirm POST REQUEST for Register');
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
    console.log(`User Registered Successfully`);
  } catch {
    console.log('User Registered Unsuccessfully please try again');
    res.redirect('/register')
  }
  console.log(users);
})

  // const { password, confirmPassword } = req.body;
  // // Check if the password and confirm password match
  // if (password !== confirmPassword) {
  //   return res.status(400).send("Passwords do not match");
  // }
  // // Here, you can proceed with user registration logic (e.g., store user details in the database)
  // // For now, let's just send a response back to the client
  // const responseMessage = `User ${name} with email ${email} has been registered successfully!`;
  // res.send(responseMessage);

// About route
app.get('/about', (req, res) => {
  console.log('Confirm GET REQUEST for About');
  res.render('about');
});

// Scanner route
app.get('/scanner', (req, res) => {
  console.log('Confirm GET REQUEST for Scanner API');
  res.render('scanner');
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
app.get('/ingredient', (req, res) => {
  console.log('Confirm GET REQUEST for Ingredients API');
  res.render('ingredient');
});

// Contact route ----------------------------------ANYTHING BETWEEN THIS AND THE NEXT LONG ASS LINE IS TODO WITH CONTACT PAGE----------------------------------
app.get('/contact', (req, res) => {
  console.log('Confirm GET REQUEST for Contact');
  res.render('contact');
});

// Handle POST request for the contact form
/* The following code handles the POST request which is the action that occurs upon sending
an email through the contact form as this is a proof of concept the email does not actually send
but a response is sent to the server to say thanks using the name variable from the form 
FIXME: Fix submission message keep getting the undefined */
app.post('/contact', (req, res) => {
  console.log('Confirm POST REQUEST for Contact');
  const { name, email, message } = req.body;
  //DEBUG DATA
  console.log('Received form data:');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Message:', message);

  // Here, you can process the form data as needed (e.g., send an email, store it in a database, etc.)

  // For now, let's just send a response back to the client
  const responseMessage = `Thank you for contacting us, ${name}! We'll get back to you soon.`;
  res.send(responseMessage);
})
// Contact route ----------------------------------THIS IS THE LONG ASS LINE I WAS REFERRING TO----------------------------------

//checkAuthenticated and checkNotAuthenticated are two functions used to check if a user is logged in or not
function checkAuthenticated(req, res, next) {
  //IF USER IS AUTHENTICATED(LOGGED IN) THEN PROCEED ELSE REDIRECT TO LOGIN PAGE
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  //IF USER IS NOT AUTHENTICATED(LOGGED IN) THEN REDIRECT TO HOME ELSE PROCEED
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

//IF RUNNING LOCALHOST PORT WILL BE 3000 but if hosted it will be the env variable AUTO SET BY HEROKU
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});