const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

// The initialize function receives passport, getUserByEmail, and getUserById as parameters
function initialize(passport, getUserByEmail, getUserById) {
  // The authenticateUser function will verify if the user exists and if the password is correct
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email)
    // Check if the user exists
    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  // Use the LocalStrategy to authenticate users
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  // Serialize and deserialize the user to maintain the user's state
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

module.exports = initialize