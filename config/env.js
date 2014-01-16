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
      clientid: env.FB_CLIENT_ID,
      clientsecret: env.FB_CLIENT_SECRET,
      callback: env.FB_CALLBACK
    },
    twitter: {
      consumerkey: env.TW_CONSUMER_KEY,
      consumersecret: env.TW_CONSUMER_SECRET,
      callback: env.TW_CALLBACK
    }
  },
  session: {
    secret: env.SESSION_SECRET
  },
  app: {
    port: env.PORT
  },
  theme: {
    name: env.THEME_NAME
  }
};