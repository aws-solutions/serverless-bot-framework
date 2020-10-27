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
var _       = require('underscore');
var _s      = require("underscore.string");

B2.PRODUCERS = function () {Emitter.call(this);}
util.inherits(B2.PRODUCERS, Emitter)

B2.PRODUCERS.protectedEntities = [];

var core;
B2.PRODUCERS.getInstance = function (coreInstance) {
    core = coreInstance;
    var instance = new B2.PRODUCERS();
    return instance;
};

/**
 * Return the base template to create a response.
 */
B2.PRODUCERS.prototype.getResponseTemplate = function (callback) {
    var tmpl = {
        "voice": B2.configs.voice,
        "version": B2.VERSION
    }

    return tmpl;
};

B2.PRODUCERS.prototype.getBestResponse = function (responses) {
    var _self              = this;
    var response           = {};
    var finalArray         = [];
    var conditionArray     = [];
    var noConditionArray   = [];
    var trueConditionArray = [];

    function runExtension (extname, payload) {
        return B2.ext[extname](core.metrics, payload);
    }

    function hasTag (tag) {
        var found = false;

        core.metrics.tags.forEach(function(element) {
            if (element == tag) {
                found = true;
            }
        }, this);

        return found;
    }

    function hasEnv (payload) {
        var found = false;

        var key = Object.keys(payload)[0];

        if (core.metrics.environmentVars[key] == payload[key]) {
            found = true;
        }

        return found;
    }

    // Start evaluating conditions
    responses.forEach(function(r){
        var condition = r.condition;

        if (condition !== undefined) {
            conditionArray.push(r);

            try {
                var evaluated = eval(condition);
                if (evaluated) {
                    B2.util.log.debug("Evaluating Responses [r=" + JSON.stringify(r) + ", eval=" + evaluated + "]", { line: __line });
                    trueConditionArray.push(r);
                } else {
                    B2.util.log.debug("Evaluating Responses [r=" + JSON.stringify(r) + ", eval=" + evaluated + "]", { line: __line });
                }
            } catch (e){
                B2.util.log.debug("Evaluating Responses [r=" + JSON.stringify(r) + ", e=" + e + "]", { line: __line });
            }
        } else {
            B2.util.log.debug("Evaluating Responses [r=" + JSON.stringify(r) + ", noCondition]", { line: __line });
            noConditionArray.push(r);
        }
    });

    if (trueConditionArray.length > 0) { // We have TRUE conditions. Use only true to randomize
        finalArray = trueConditionArray;
        B2.util.log.silly("Evaluating Responses (We have TRUE conditions) [total=" + trueConditionArray.length + "]", { line: __line });
    } else if (conditionArray.length == 0) { // We don't have conditions in responses. Use all to randomize
        finalArray = responses;
        B2.util.log.silly("Evaluating Responses (We don't have conditions. Randomizing All Responses) [total=" + finalArray.length + "]", { line: __line });
    } else if ((conditionArray.length > 0) && (noConditionArray.length > 0)) { // With Conditions but not TRUE conditions. Use no conditions to response
        finalArray = noConditionArray;
        B2.util.log.silly("Evaluating Responses (We have conditions, but not TRUE conditions. Randomizing noConditionArray) [total=" + noConditionArray.length + "]", { line: __line });
    } else {
        finalArray = responses;
        B2.util.log.silly("Evaluating Responses (Else Condition) [total=" + finalArray.length + "]", { line: __line });
    }

    var pos  = Math.floor(Math.random() * finalArray.length) + 1
    response.text   = finalArray[pos - 1].text;
    response.speech = finalArray[pos - 1].speech;

    return response;
}

/**
 * Function used to return a simpleResponse object
 */
B2.PRODUCERS.prototype.simpleResponse = function (bestMatch, callback) {
    var _self    = this;
    var response = undefined;

    var knowledge = bestMatch.knowledge;
    var responses = knowledge._source.response;

    if (responses.length > 0) {
        response = _self.getResponseTemplate();
        response = _.extend(response, _self.getBestResponse(responses));
    }

    // Callback afterBackendResponseExtension
    response = _self.executeCallbacks(response);

    if (callback) {
        callback(response);
    } else {
        return response;
    }
};

/**
 * Function used to return a treeConversation object
 */
B2.PRODUCERS.prototype.treeConversation = function (intent, bestMatch, callback, payloadFromClient) {
    var _self     = this;
    var response  = undefined;

    var knowledge = bestMatch.knowledge;
    var nodes     = knowledge._source.nodes;

    var fillResponse = function(key, node){
        var response = undefined;
        var ask = node.ask;

        var generateReturn;

        if (knowledge._source.generateReturn !== undefined) {
            generateReturn = knowledge._source.generateReturn;
        }

        if (ask.length > 0) {
            response = _self.getResponseTemplate();
            response.conversation = {};
            response.conversation._id = knowledge._id;
            response.conversation.generateReturn = generateReturn;
            response.conversation.async = {};
            response.conversation.async.id = key;
            response.conversation.async.ask = _self.getBestResponse(ask);

            if (node.richResponseObject !== undefined) {
                response.conversation.async.richResponseObject = node.richResponseObject;

                if (node.goToNode !== undefined) {
                    response.conversation.async.goToNode = node.goToNode;
                }
            } else if (node.router !== undefined) {
                response.conversation.async.endConversation = true;
                response.router = node.router;
            } else {
                if (node.goToNode !== undefined) {
                    response.conversation.async.goToNode = node.goToNode;
                }
            }

            if (node.endConversation !== undefined) {
                response.conversation.async.endConversation = node.endConversation;
            }
        }

        return response;
    }

    // Start of Tree Navigation
    if (payloadFromClient === undefined) {
        var node = nodes["root"];
        var generateReturn = false;

        if (node !== undefined) {
            response = fillResponse("root", node);
        }
    } else {
        // Retrieve lastNode
        var payload = payloadFromClient;
        var keys = Object.keys(payload);

        var lastNode = undefined;
        var parent   = undefined;

        keys.forEach(function(p){
            var chave = p;
            var item  = payload[p];

            lastNode  = p;
            parent    = item;
        });

        // GOTO Implementation :/
        if (parent.response) {
            if (_s(parent.response).startsWith("goto:")) {
                var gotoNode = parent.response.split("goto:")[1];
                if (gotoNode) {
                    response = fillResponse(gotoNode, nodes[gotoNode]);
                }
            }
        }

        var keysNodes = Object.keys(nodes);
        keysNodes.forEach(function(i) {
            var node   = nodes[i];
            // Query only nodes with last parent
            var p = node.parent;

            if ((p !== undefined) && (p === lastNode)) {
                var condition = node.condition;

                if ((eval(condition)) && response === undefined) {
                    response = fillResponse(i, node);
                }
            }
        });

        if (response === undefined) { //Go back
            response = fillResponse(lastNode, nodes[lastNode]);
        }
    }

    // Callback afterBackendResponseExtension
    response = _self.executeCallbacks(response);

    if (callback) {
        callback(response);
    } else {
        return response;
    }
};

/**
 * Function used to return a history object
 */
B2.PRODUCERS.prototype.history = function (bestMatch, callback) {
    var _self    = this;
    var response = undefined;

    var knowledge    = bestMatch.knowledge;
    var startHistory = knowledge._source.response[0];
    var history      = knowledge._source.history;

    response         = _self.getResponseTemplate();
    response.text    = startHistory.text;
    response.speech  = startHistory.speech;
    response.history = history;

    // Callback afterBackendResponseExtension
    response = _self.executeCallbacks(response);

    if (callback) {
        callback(response);
    } else {
        return response;
    }
};

/**
 * Function used to execute a stack of custom parsers
 */
B2.PRODUCERS.prototype.executeCallbacks = function (response) {
    // Callback afterBackendResponseExtension
    if (B2.ext['afterBackendResponseExtension']) {
        B2.util.log.debug("Event BEFORE Callback afterBackendResponseExtension (OVERRIDDEN) [" + JSON.stringify(response) + "]", { line: __line });

        try {
            response = B2.ext['afterBackendResponseExtension'](response);
        } catch (e) {
            B2.util.log.error("Error Running Callback [callback=" + "afterBackendResponseExtension" + ", error=" + e + "]", { line: __line });
        }

        B2.util.log.debug("Event AFTER Callback afterBackendResponseExtension (OVERRIDDEN) [" + JSON.stringify(response) + "]", { line: __line });
    } else {
        response = B2.getModule("PARSERS", core).evaluateReplaceParameters(response);
    }

    return response;
}

/**
 * Call backend using lambda functions
 *
 */
B2.PRODUCERS.prototype.backendResponse = function (intent, bestMatch, callback, payloadFromClient) {
    var _self  = this;
    var lambda = B2.getModule("AWS", core).lambda;
    var params = B2.getModule("PARAMETERS", core);

    params.on('moreInformationNeeded', function(response){
        response = _self.executeCallbacks(response);

        core.metrics.moreInformationNeeded = true;

        _self.emit('moreInformationNeeded', response);
        return;
    });

    params.on('extractionComplete', function(payload){
        var arn     = bestMatch.knowledge._source.arn;
        var arnRole = bestMatch.knowledge._source.rolearn;
        var persistEntities = false;

        if (payload == undefined) {
            payload = {};
        }
        payload.lang = core.event.lang;
        payload.userInfo = core.event.userInfo;
        payload._tags = bestMatch._tags;
        payload._entities = bestMatch._entities;
        payload._temporalEntities = bestMatch._temporalEntities;

        var trataRetornoLambda = function (backendResponse, callback) {
            if (backendResponse === undefined) {
                var response                 = _self.getResponseTemplate();
                response.text            = B2.i18n.errorMessage.text;
                response.speech          = B2.i18n.errorMessage.speech;
                response.endConversation = true;

                if (callback) {
                    callback(response, payload);
                    return;
                } else {
                    return response;
                }
            }

            if (B2.CORE.getObjType(backendResponse) == B2.objTypes.STRING) {
                backendResponse = backendResponse.replace(/\"/g, "");
                var brObj = {}
                brObj.return = backendResponse;
                try {
                    brObj = JSON.stringify(brObj);
                    brObj = brObj.replace(/\\\\/g, "\\");
                    brObj = JSON.parse(brObj);
                } catch (e){}
                response        = _self.getResponseTemplate();
                response.text   = brObj.return;
                response.speech = brObj.return;
            } else if (B2.CORE.getObjType(backendResponse) == B2.objTypes.OBJECT) {
                if (B2.CORE.isAsyncConversation(backendResponse)) {
                    response = _self.asyncConversation(bestMatch, undefined, backendResponse);
                } else {
                    response = JSON.parse(backendResponse);
                }

                if (response.persistEntities !== undefined)
                    persistEntities = response.persistEntities;
            }

            B2.util.log.debug("persistEntities Status [" + persistEntities + "]", { line: __line });

            // Persist Entities
            var entityEngine = B2.getModule("ENTITY", core);
            if (persistEntities)
                entityEngine.persistEntities(payload, bestMatch.knowledge);

            try {
                response = JSON.parse(response);
            } catch (e) {}

            // Callback afterBackendResponseExtension
            response = _self.executeCallbacks(response);

            if (callback) {
                callback(response, payload);
            } else {
                return response;
            }
        };

        var trataRetornoStepFunctions = function (backendResponse, callback) {
            if (callback) {
                callback(response, payload);
            } else {
                return response;
            }
        };

        var callBackend = function (payload){
            if (arnRole == undefined) {
                if (B2.CORE.getBackendService(arn) == B2.serviceTypes.LAMBDA) {
                    lambda.invokeSync(arn, payload, function(backendResponse){
                        trataRetornoLambda(backendResponse, callback);
                    });
                }
            } else {
                B2.getModule("AWS", core).assumeRole(arnRole, function(credentials){
                    if (B2.CORE.getBackendService(arn) == B2.serviceTypes.LAMBDA) {
                        lambda.invokeSyncWithCredentials(arn, credentials, payload, function (backendResponse) {
                            trataRetornoLambda(backendResponse, callback);
                        });
                    }
                });
            }
        }

        callBackend(payload);
    });

    var sessionID = core.metrics.sessionID;
    B2.getModule("CTX", core).injectContext(sessionID, bestMatch.knowledge)
    .then(function(context){
        params.returnPayload(intent, bestMatch, payloadFromClient, context);
    });
};

/**
 *
 */
B2.PRODUCERS.prototype.asyncConversation = function (bestMatch, callback, backendResponse) {
    var _self       = this;
    var response    = undefined;
    var generateReturn = false;

    try {
        backendResponse = JSON.parse(backendResponse);
    } catch(e){}


    var knowledge = bestMatch.knowledge;
    response      = _self.getResponseTemplate();

    if (knowledge._source.generateReturn !== undefined) {
        generateReturn = knowledge._source.generateReturn;
    }

    var conversation = {
        "_id": knowledge._id,
        "generateReturn": generateReturn,
        "async": backendResponse.asyncConversation
    }

    response.conversation = conversation;

    if (callback) {
        callback(response);
    } else {
        return response;
    }
};

B2.PRODUCERS.prototype.syncConversation = function (bestMatch, callback) {
    var _self       = this;
    var response    = undefined;
    var generateReturn = false;

    var knowledge = bestMatch.knowledge;
    response      = _self.getResponseTemplate();

    var pos  = Math.floor(Math.random() * knowledge._source.syncConversation.length) + 1;

    if (knowledge._source.generateReturn !== undefined) {
        generateReturn = knowledge._source.generateReturn;
    }

    var conversation = {
        "_id": knowledge._id,
        "generateReturn": generateReturn,
        "sync": knowledge._source.syncConversation[pos - 1]
    }

    response.conversation = conversation;

    if (callback) {
        callback(response);
    } else {
        return response;
    }
};

module.exports = B2.PRODUCERS;
