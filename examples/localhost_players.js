//var SqueezeServer = require('squeezenode');
var SqueezeServer = require('../');
var squeeze = new SqueezeServer('http://127.0.0.1', 9000);

// subscribe for the 'register' event to ensure player registration is complete
squeeze.on('register', function(areply){
    //you're ready to use the api, eg.

    // Callback
    squeeze.getPlayers( function(breply) {
        console.log('getPlayers(callback): %j',breply);
    });

    // Promise
    return squeeze.getPlayerCount()
	        .then(reply => {
		    console.log('getPlayerCount(promise): %j', reply);
		    return reply.result;
	        })
		.catch(reply => {
		     console.log('failed getPlayerCount(promise): %j', reply);
		});

});

