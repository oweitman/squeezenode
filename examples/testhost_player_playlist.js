//var SqueezeServer = require('squeezenode');
var SqueezeServer = require('../');
var squeeze = new SqueezeServer('http://squeezenode-test', 9000);
// subscribe for the 'register' event to ensure player registration is complete
squeeze.on('register', function(reply){
    console.dir(reply);
    if (reply.ok) {
        var player = squeeze.findPlayerObjectByName('test',true);
        console.dir(player);
	// Genre , Artist, Album`
        player.callMethod({
            method: 'playlist',
            params: [
                'loadalbum',
                   '*' ,  // LMS wants an asterisk if nothing if specified Genre, Artist, Album
		   '*',
		   'Iron Maiden',
            ]
        }).then(function (result) { console.dir(result) })
     } 
});

