//var SqueezeServer = require('squeezenode');
var SqueezeServer = require('../');
var squeeze = new SqueezeServer('http://localhost', 'ssh://pi:'+encodeURIComponent('file://./id_rsa')+'@testpi', undefined, undefined ,true);
//subscribe for the 'register' event to ensure player registration is completes
squeeze.on('register', function(getplayersReply,appsReply){
        console.dir(getplayersReply);
});

