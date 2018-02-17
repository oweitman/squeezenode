var SqueezeServer = require('../');
//var SqueezeServer = require('squeezenode');
var squeeze = new SqueezeServer('http://127.0.0.1', 9000);
// subscribe for the 'register' event to ensure player registration is complete
squeeze.on('register', function(){
    //you're ready to use the api, eg.
        squeeze.getPlayers( function(reply) {
                    console.dir(reply);
        });
});

