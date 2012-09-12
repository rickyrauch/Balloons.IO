Balloons.IO
===========

Balloons.IO is a web multi-room chat server and client ready to use.
It’s build with the help of node.JS, Express, Socket.IO and Redis. [Follow us on twitter][]

  [Follow us on twitter]: https://twitter.com/balloonsio
 
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
    mv config.sample.json config.json

Then, edit config.json with your favorite text editor and add Facebook & Twitter keys.

To allow Sign In with Twitter: [Create a new application](https://dev.twitter.com/apps/new) and copy 
the keys that Twitter gives you into 'config.json'.

To allow Sign In with Facebook: [Create a new application](https://developers.facebook.com/apps) and copy the keys Facebook gives you into 'config.json'

Go to terminal and run `node balloons`.

Point your browser to `http://127.0.0.1:6789` (You can also change the port from 'config.json')

Balloons uses [PassportJS](http://passportjs.org) for authentication with Twitter and Facebook.

Enjoy!











## License 

(The MIT License)

Copyright (c) 2011 Gravity On Mars &lt;work@gravityonmars.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
