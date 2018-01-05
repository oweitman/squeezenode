/*
 The MIT License (MIT)

 Copyright (c) 2013-2015 Piotr Raczynski, pio[dot]raczynski[at]gmail[dot]com

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

var jayson = require('jayson');
var inherits = require('super');
var AWS;


function SqueezeRequest(address, port, username, password) {
  
    this.address = (address !== undefined) ? address : "localhost";
    this.port = (port !== undefined) ? port : 9000;
    this.username = username;
    this.password = password;
    var jsonrpc = this.address + ':' + this.port + '/jsonrpc.js';
    var client = jayson.client.http(jsonrpc);
    client.options.version = 1;
    this.queue = [];
    this.id = "squeezenode."+process.pid;// FIXME lamba seems to be 1 always add instance?
    var that = this;

    function handle(err, reply, callback) {
        var result = {};
        if (err) {
            result = err;
            result.ok = false;
        }
        else {
            result = reply;
            result.ok = true;
        }
        if (callback)
            callback(result);
    }

    if (port == 'aws') {
        AWS = require('aws-sdk');
	this.request = request_sqs;
	this.sqs = new AWS.SQS({region: 'us-west-2'});
	this.sendq = { QueueUrl: password.send, MessageGroupId: this.id };
	this.recvq = { QueueUrl: password.recv, WaitTimeSeconds: 0, MaxNumberOfMessages: 10};
	this.reciving = true
	this.sqs.receiveMessage(that.recvq, function (err, reply) {
		that.recvq.MaxNumberOfMessages = 1;
		that.recvq.WaitTimeSeconds = 20;
		if (reply.Messages) {
			var msg = reply.Messages.pop();
			while (msg) {
				var deleteParams = {
					QueueUrl: that.recvq.QueueUrl,
					ReceiptHandle: msg.ReceiptHandle
				};
				that.sqs.deleteMessage(deleteParams, function(err, data) {});
				msg = reply.Messages.pop();
			}
		}
		request_sqs_dispatch_queue();
	}); //Drain Q.
    } else {
	this.request = request_rpc;

	// Add a header for basic authentication if a username and password are given
	if (username && password) {
		if (! client.options.headers)
			client.options.headers = {};
		client.options.headers['Authorization'] = formatBasicHeader(username, password);
	}
    }

    function request_rpc(player, params, callback) {
        client.request('slim.request', [player, params], that.id, function (err, reply) {
            handle(err, reply, callback);
        });
    }

    function request_sqs_dispatch(player, params, callback) {
	that.sendq['MessageBody'] = JSON.stringify({"params":[player, params],"id":that.id,"version":"1.0","method":"slim.request"}); // FIXME id not on pid but an uuid? for instrance from env?
	that.sendq['MessageDeduplicationId'] = that.sendq.MessageGroupId+process.hrtime();
	//console.log("send ",that.sendq['MessageBody']);
	that.sqs.sendMessage(that.sendq, function(err, data) {
		  if (err) {
			handle(err, data, callback);
			console.error("Send Error ",err);
		  } else {
			// successful response - callback for reply
			that.reciving = true;
			that.sqs.receiveMessage(that.recvq, function (err, reply) {
				//console.log("reply data ",reply);
				var message_data = {};
				if (reply.Messages) {
					//id check?
					message_data = reply.Messages.pop();
					//delete and drain?
					var msg = message_data;
					message_data = JSON.parse(message_data.Body);
					//console.log("reply ",message_data);
					while (msg) {
						var deleteParams = {
							QueueUrl: that.recvq.QueueUrl,
							ReceiptHandle: msg.ReceiptHandle
						};
						// FIXME delete error
						that.sqs.deleteMessage(deleteParams, function(err, data) {
							if (err) {
								console.error("Delete Error", err);
							} else {
								//console.log("Message Deleted", data);
							}
						});
						msg = reply.Messages.pop();
					}
				} else {
					console.warn("no msgs ",err);
					err = "No reply message recvied";
				}
				handle(err, message_data, callback);
				request_sqs_dispatch_queue();
			});
		  }
	});
    }

    // We need to serialise requests and responces for queue use
    function request_sqs(player, params, callback) {
	if (that.reciving) {
		that.queue.push([player, params, callback]);
	} else {
		request_sqs_dispatch(player, params, callback);
	}
    }

    function request_sqs_dispatch_queue() {
	    var args = that.queue.pop();
	    if (args) {
		    request_sqs_dispatch.apply(null,args);
	    } else {
		    that.reciving = false;
	    }
    }
}

/**
 * Function to format the header for basic authentication.
 */

function formatBasicHeader(username, password) {
  var tok = username + ':' + password;
  var hash = new Buffer(tok).toString('base64');
  return "Basic " + hash;
}

module.exports = SqueezeRequest;
