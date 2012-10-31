
/*
 * Module dependencies
 */

var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , config = require('./config.json');

module.exports = function(app, client) {

/*
 * Auth strategy
 */

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

/*
 * Twitter Strategy
 */

if(config.auth.twitter.consumerkey.length) {
  passport.use(new TwitterStrategy({
      consumerKey: config.auth.twitter.consumerkey,
      consumerSecret: config.auth.twitter.consumersecret,
      callbackURL: config.auth.twitter.callback
    },
    function(token, tokenSecret, profile, done) {
      client.hmset('users:twitter' + profile.username, profile);
      return done(null, profile);
    }
  ));

  // Twitter auth routes
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
} 

/*
 * Facebook Strategy
 */

if(config.auth.facebook.clientid.length) {
  passport.use(new FacebookStrategy({
      clientID: config.auth.facebook.clientid,
      clientSecret: config.auth.facebook.clientsecret,
      callbackURL: config.auth.facebook.callback
    },
    function(accessToken, refreshToken, profile, done) {
      client.hmset('users:facebook:' + profile.username, profile);
      return done(null, profile);
    }
  ));


  // Facebook auth routes
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );

}

};
