
/*
 * Module dependencies
 */

var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , config = require('./config.json');

/*
 * Auth strategy
 */

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new TwitterStrategy({
    consumerKey: config.auth.twitter.consumerkey,
    consumerSecret: config.auth.twitter.consumersecret,
    callbackURL: config.auth.twitter.callback
  },
  function(token, tokenSecret, profile, done) {
    return done(null, profile);
  }
));
