/**
 * Module dependencies.
 */

var env = process.env;

/**
 * Expose environment configuration
 */

module.exports = {
  redisURL: env.REDIS_URL || env.REDISTOGO_URL || "",
  auth: {
    facebook: {
      clientID: env.FB_CLIENT_ID,
      clientSecret: env.FB_CLIENT_SECRET,
      callback: env.FB_CALLBACK
    },
    twitter: {
      consumerKey: env.TW_CONSUMER_KEY,
      consumerSecret: env.TW_CONSUMER_SECRET,
      callback: env.TW_CALLBACK
    }
  },
  session: {
    secret: env.SESSION_SECRET || "b.io:secret"
  },
  app: {
    port: env.PORT || 6789
  },
  theme: {
    name: env.THEME_NAME || "default"
  }
};