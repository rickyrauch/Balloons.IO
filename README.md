# Balloons.IO

Balloons.IO is a web multi-room chat server and client ready to use.
It’s build with the help of node.JS, Express, Socket.IO and Redis. [Follow us on twitter][]

  [Follow us on twitter]: http://twitter.com/gravityonmars
 
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

If you have these 2 tools installed, go to terminal and type:

`npm install`

Balloons uses [PassportJS](http://passportjs.org) for authentication with Twitter. For now, this is the only authentication method we provide.

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
