const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) return done(null, false, { message: 'No account found with that email.' });
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
        return done(null, admin);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((admin, done) => done(null, admin.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const admin = await Admin.findById(id);
      done(null, admin);
    } catch (err) {
      done(err);
    }
  });
};
