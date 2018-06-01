/*
 The MIT License (MIT)

 Copyright (c) 2013 Piotr Raczynski, pio[dot]raczynski[at]gmail[dot]com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

var inherits = require('super');
var fs = require('fs');
var SqueezeRequest = require('./squeezerequest');
var SqueezePlayer = require('./squeezeplayer');

/**
 * Create a SqueezeServer object
 *
 * @param address The URL of the server
 * @param port The port that the server listens on
 * @param username The username for authentication
 * @param password The password for authentication
 * @param sa A flag to skip apps
 */

function SqueezeServer(address, port, username, password, sa) {

    SqueezeServer.super_.apply(this, arguments);
    var defaultPlayer = "00:00:00:00:00:00";
    var self = this;
    this.players = [];
    this.apps = [];
    var subs = {};
    this.playerUpdateInterval = 2000;

    /**
     * Subscribe to an event on a channel
     *
     * @param channel The channel that received the event
     * @param sub The callback for the event
     */

    this.on = function (channel, sub) {

        subs[channel] = subs[channel] || [];
        subs[channel].push(sub);
    };

    /**
     * Send an event.
     *
     * @param channel The even channel
     */

    this.emit = function (channel) {

        let args = [].slice.call(arguments, 1);
        for (let sub in subs[channel]) {
            subs[channel][sub].apply(void 0, args);
        }
    };

    /**
     * Method to the the number of players.
     *
     * @param callback The function to call with the result.
     */

    this.getPlayerCount = function (callback) {
        this.request(defaultPlayer, ["player", "count", "?"], callback);
    };

    /**
     * Method to get the ID of a player given it's index
     *
     * @param index The index of the player to get the ID for
     * @param callback The function to call with the result.
     */

    this.getPlayerId = function (index, callback) {
        this.request(defaultPlayer, ["player", "id", index, "?"], callback);
    };

    /**
     * Method to get the IP address of a player
     *
     * @param playerId The ID or index of the player
     * @param callback The function to call with the result.
     */

    this.getPlayerIp = function (playerId, callback) {
        this.request(defaultPlayer, ["player", "ip", playerId, "?"], callback);
    };

    /**
     * Method to get the name of a player.
     *
     * @param playerId The ID or index of the player
     * @param callback The function to call with the result.
     */

    this.getPlayerName = function (playerId, callback) {
        this.request(defaultPlayer, ["player", "name", playerId, "?"], callback);
    };

    /**
     * Get a list of the synchronization group members
     *
     * @param callback The function to call with the result.
     */

    this.getSyncGroups = function (callback) {
        this.request(defaultPlayer, ["syncgroups", "?"], callback);
    };

    /**
     * Get a list of the apps installed in the server
     *
     * @param callback The function to call with the result.
     */

    this.getApps = function (callback) {
        this.request(defaultPlayer, ["apps", 0, 100], callback);
    };

    //

    /**
     * Get the content of a music folder.
     *
     * @param folderId The ID of the folder to get. Pass 0 or empty string "" to display root of music folder
     * @param callback The function to call with the result.
     */

    this.musicfolder = function (folderId, callback) {
        this.request(defaultPlayer, ["musicfolder", 0, 100, "folder_id:" + folderId], callback);
    };

    /**
     * Get a information about the players.
     *
     * @param callback The function to call with the result.
     */

    this.getPlayers = function (callback) {

        self.request(defaultPlayer, ["players", 0, 100], function (reply) {
            if (reply.ok)
                reply.result = reply.result.players_loop;
            callback(reply);
        });
    };

    /**
     * Get a list of the artists from the server
     *
     * @param callback The callback to call with the result
     * @param limit The maximum number of results
     */

    this.getArtists = function (callback, limit) {

        self.request(defaultPlayer, ["artists", 0, limit], function (reply) {
            if (reply.ok)
                reply.result = reply.result.artists_loop;
            callback(reply);
        })
    };

    /**
     * Get a list of the albums from the server
     *
     * @param callback The callback to call with the result
     * @param limit The maximum number of results
     */

    this.getAlbums = function (callback, limit) {

        self.request(defaultPlayer, ["albums", 0, limit], function (reply) {
            if (reply.ok)
                reply.result = reply.result.albums_loop;
            callback(reply);
        })
    };

    /**
     * Get a list of the genre's from the server
     *
     * @param callback The callback to call with the result
     * @param limit The maximum number of results
     */

    this.getGenres = function (callback, limit) {

        self.request(defaultPlayer, ["genres", 0, limit], function (reply) {
            if (reply.ok)
                reply.result = reply.result.genres_loop;
            callback(reply);
        })
    };

    /**
     * Get a 'info' list from the server
     *
     * @param callback The callback to call with the result
     * @param limit The maximum number of results
     * @param slot The query to make to the server [genres, albums, artists, playlists ]
     */

    this.getInfo = function (callback, limit, slot) {

        self.request(defaultPlayer, [slot, 0, limit], function (reply) {
            if (reply.ok)
                reply.result = reply.result[slot + '_loop'];
            callback(reply);
        })
    };

    /**
     * Find out if we can contact the server and get some basic information
     *
     * @param skipApps A flag to skip getting information about the apps
     */

    function register(skipApps) {

        // Get the list of players from the server

        self.getPlayers(function (reply) {

            // Process the player information and create Player objects for each one

            let players = reply.result;
            for (let pl in players) {
                if (! self.players[players[pl].playerid]) { // player not on the list
                    self.players[players[pl].playerid] = new SqueezePlayer(players[pl].playerid, players[pl].name, self.address, self.port, self.username, self.password);
                }
            }

            // Send a signal that we are done

            if (skipApps) {
                self.emit('register', reply, undefined);
            } else {
                self.emit('registerPlayers', reply);
            }
        });

        // Once the players have been obtained, request a list of the apps

        self.on('registerPlayers', function (reply) {

            self.getApps(function (areply) {

                if (areply.ok) {
                    
                    let apps = areply.result.appss_loop;
                    let dir = __dirname + '/';
                    fs.readdir(dir, function (err, files) {
                        files.forEach(function (file) {
                            
                            let fil = file.substr(0, file.lastIndexOf("."));
                            for (let pl in apps) {
                                if (fil === apps[pl].cmd) {
                                    let app = require(dir + file);
                                    self.apps[apps[pl].cmd] = new app(defaultPlayer, apps[pl].name, apps[pl].cmd, self.address, self.port, self.username, self.password);
                                    /* workaround, app needs existing player id so first is used here */
                                }
                            }
                        });

                        self.emit('register', reply, areply);
                    });

                } else
                    self.emit('register', reply, areply);
            });
        });
    }

    register(sa);
}

inherits(SqueezeServer, SqueezeRequest);

module.exports = SqueezeServer;
