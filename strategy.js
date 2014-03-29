
/*
 * Module dependencies
 */

var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , GitHubStrategy = require('passport-github').Strategy;

/**
 * Expose Authentication Strategy
 */

module.exports = Strategy;

/*
 * Defines Passport authentication
 * strategies from application configs
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Strategy (app) {
  var config = app.get('config');

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  if(config.auth.twitter.consumerkey.length) {
    passport.use(new TwitterStrategy({
        consumerKey: config.auth.twitter.consumerkey,
        consumerSecret: config.auth.twitter.consumersecret,
        callbackURL: config.auth.twitter.callback
      },
      function(token, tokenSecret, profile, done) {
        return done(null, profile);
      }
    ));
  } 

  if(config.auth.facebook.clientid.length) {
    passport.use(new FacebookStrategy({
        clientID: config.auth.facebook.clientid,
        clientSecret: config.auth.facebook.clientsecret,
        callbackURL: config.auth.facebook.callback
      },
      function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
      }
    ));
  }

  if(config.auth.github.clientid.length) {
    passport.use(new GitHubStrategy({
        clientID: config.auth.github.clientid,
        clientSecret: config.auth.github.clientsecret,
        callbackURL: config.auth.github.callback
      },
      function(token, tokenSecret, profile, done) {
        return done(null, profile);
      }
    ));
  }
}

