# Balloons.IO

Balloons.IO is a web multi-room chat server and client ready to use.
It’s build with the help of node.JS, Express, Socket.IO and Redis. [Follow us on twitter][]

  [Follow us on twitter]: http://twitter.com/gravityonmars
 
 ![image][]
  [image]: http://gravityonmars.com/wp-content/themes/gom3/images/projects/balloons-io/app-1.png

## Installation

The installation of certain tools can be a bit annoying, but these then
become inseparable friends to all developer. We will not explain how
to install each and every one of these tools, especially because their
sites do much better than what we could do ourselves:

### Requirements

-   [node.JS]: http://nodejs.org
-		[Redis-server]: http://redis.io

If you have these 2 tools installed, go to terminal and type:

`npm install`

Balloons uses easy-OAuth for authentication with Twitter. For now, this is the only authentication method we provide.

To set up Balloons with Twitter follow these few steps:

* Copy 'config.sample.json' to 'config.json'.
* Log in with your account at https://dev.twitter.com/. 
* Create a new application (https://dev.twitter.com/apps/new) and copy 
the keys that Twitter gives you into 'config.json'.
* Update the callback url to the one you provided to Twitter.
* Go to terminal and run `node balloons`.

Point your browser to `http://127.0.0.1:6789`.
(You can also change the port from 'config.json')

Enjoy!
