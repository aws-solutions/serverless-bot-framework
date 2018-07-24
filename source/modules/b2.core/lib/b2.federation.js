var B2      = require('../index.js');
var path    = require('path');
var http    = require('http');
var util    = require('util');
var Emitter = require('events').EventEmitter;
var AWS     = require('aws-sdk');

B2.FEDERATION = function () {Emitter.call(this);}
util.inherits(B2.FEDERATION, Emitter)
var core;

B2.FEDERATION.getInstance = function (coreInstance) {
    core = coreInstance;
    return new B2.FEDERATION();
};

B2.FEDERATION.prototype.callFederatedBrain = function (firstbrain, event) {
    return new Promise(function(resolve, reject) {
        var req     = new AWS.HttpRequest(firstbrain.URL);
        req.method  = 'POST';
        req.body    = JSON.stringify(event);
        req.headers['x-api-key'] = firstbrain["API-KEY"];
        var send = new AWS.NodeHttpClient();
    
        try {
          send.handleRequest(req, null, function(httpResp) {
              var respBody = '';
              httpResp.on('data', function (chunk) {
                respBody += chunk;
              });
              httpResp.on('end', function (chunk) {
                var response = JSON.parse(respBody);
    
                resolve(response);
            });
          }, function(err) {
            reject(e);
          });
        } catch (e) {
          reject(e);
        }
    });
}

module.exports = B2.FEDERATION;
