Balloons.IO
===========

Balloons.IO is a web multi-room chat server and client ready to use.
It’s build with the help of node.JS, Express, Socket.IO and Redis. 
 
 ![image][]
  [image]: http://www.gravityonmars.com/wp-content/themes/gom3/images/projects/balloons-io/app-1.png

## Installation

The installation of certain tools can be a bit annoying, but these then
become inseparable friends to all developer. We will not explain how
to install each and every one of these tools, especially because their
sites do much better than what we could do ourselves:

### Requirements

-   [node.JS](http://nodejs.org)
-		[Redis-server](http://redis.io)


### Install Redis

    wget http://redis.googlecode.com/files/redis-2.4.17.tar.gz
    tar xvf redis-2.4.17.tar.gz
    cd redis-2.4.17
    make && make install

Start Redis

`./redis-server ./redis.conf`


### Install Balloons.IO

If you have these 2 tools installed, go to terminal and type:

    git clone https://github.com/gravityonmars/Balloons.IO.git
    cd Balloons.IO
    npm install
    mv config/config.sample.json config/config.json

Then, edit config/config.json with your favorite text editor and add Facebook & Twitter keys.

To allow Sign In with Twitter: 

- [Create a new application](https://dev.twitter.com/apps/new) and copy the keys that Twitter gives you into 'config/config.json'. 

- Go to your Twitter app Settings and add the Callback URL contained in 'config/config.json': http://127.0.0.1:6789/auth/twitter/callback

To allow Sign In with Facebook:

- [Create a new application](https://developers.facebook.com/apps) and copy the keys Facebook gives you into 'config/config.json'.

- Go to your Facebook app Settings/Basic, click on Website with Facebook Login and add the Callback URL contained in 'config/config.json':
http://127.0.0.1:6789/auth/facebook/callback

Go to terminal and run `node balloons`.

Point your browser to `http://127.0.0.1:6789` (You can also change the port from 'config/config.json')

Balloons uses [PassportJS](http://passportjs.org) for authentication with Twitter and Facebook.

Enjoy!


## Contributors 
- [Dan Zajdband](https://twitter.com/dzajdband)
- [Ricardo Rauch](https://twitter.com/gravityonmars)
- [Cristian Douce](https://twitter.com/dzajdband)









## License 

MIT
