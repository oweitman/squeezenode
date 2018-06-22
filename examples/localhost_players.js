//var SqueezeServer = require('squeezenode');
var SqueezeServer = require('../');
var squeeze = new SqueezeServer('http://127.0.0.1', 9000);

// subscribe for the 'register' event to ensure player registration is complete
squeeze.on('register', function(areply,apps){
    //you're ready to use the api, eg.
    console.log('Rgesiter getPlayers: %j\n', areply);
    console.log('Rgesiter getApps: %j\n', apps);

    // Callback
    squeeze.getPlayers( function(breply) {
        console.log('getPlayers(callback): %j\n', breply);
    });

    // Promise
    squeeze.getPlayerCount()
	        .then(reply => {
		    console.log('getPlayerCount(promise): %j\n', reply);
		    return squeeze.getSyncGroups();
	        })
	        .then(reply => {
		    console.log('getPlayerSyncGroups(promise): %j\n', reply);
		})
		.catch(reply => {
		     console.log('failed promise: %j', reply);
		});

});

