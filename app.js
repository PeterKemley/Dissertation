// ./app.js
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
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

// Login route
app.get('/login', (req, res) => {
  console.log('Confirm GET REQUEST for Login');
  res.render('login');
});

// Register route
app.get('/register', (req, res) => {
  console.log('Confirm GET REQUEST for Register');
  res.render('register');
});


// POST request for user registration
app.post('/register', (req, res) => {
  console.log('Confirm POST REQUEST for Register');
  const { name, email, password, confirmPassword } = req.body;

  console.log('Received form data:');
  console.log('Name:', name);
  console.log('Email:', email);

  // Check if the password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  // Here, you can proceed with user registration logic (e.g., store user details in the database)
  // For now, let's just send a response back to the client
  const responseMessage = `User ${name} with email ${email} has been registered successfully!`;
  res.send(responseMessage);
});

// About route
app.get('/about', (req, res) => {
  console.log('Confirm GET REQUEST for About');
  res.render('about');
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

//IF RUNNING LOCALHOST PORT WILL BE 3000 but if hosted it will be the env variable AUTO SET BY HEROKU
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
