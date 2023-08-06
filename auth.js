// auth.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const NeDB = require('nedb');

const usersDB = new NeDB({ filename: 'users.db', autoload: true });

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  usersDB.findOne({ _id: id }, (err, user) => {
    done(err, user);
  });
});

// Local Strategy for login
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    usersDB.findOne({ email: email }, (err, user) => {
      if (err) return done(err);

      if (!user) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return done(err);

        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
      });
    });
  }
));

module.exports = passport;
