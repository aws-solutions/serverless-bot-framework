/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           
 *                                                                                                                    
 *  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance     
 *  with the License. A copy of the License is located at                                                             
 *                                                                                                                    
 *      http://www.apache.org/licenses/                                                                               
 *                                                                                                                    
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES 
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    
 *  and limitations under the License.                                                                                
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

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
        console.debug(`Event passed to callFedration brain: ${JSON.stringify(event)}`);
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
