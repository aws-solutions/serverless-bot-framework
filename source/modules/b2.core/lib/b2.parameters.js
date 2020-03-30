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

var B2   = require('../index.js');
var util   = require('util');
var natural = require('natural');

var Emitter = require('events').EventEmitter;
var db;
var instance;

B2.PARAMETERS = function () {Emitter.call(this);}
util.inherits(B2.PARAMETERS, Emitter)
var core;

B2.PARAMETERS.getInstance = function (coreInstance) {
    core = coreInstance;
    instance = new B2.PARAMETERS();
    db = B2.getModule("AWS", core).dynamo;

    return instance;
};

B2.PARAMETERS.prototype.returnPayload = function (intent, bestMatch, payloadFromClient, context) {
    var _self = this;
    B2.util.log.debug("Returning Payload: [payloadFromClient=" + JSON.stringify(payloadFromClient) + "]", { line: __line });

    if (payloadFromClient != undefined) {
        _self.extractParameters(intent.parsedIntent, bestMatch, payloadFromClient, context, function(p){
            return;
        });
    } else {
        _self.extractParameters(intent, bestMatch, payloadFromClient, context, function(p){
            return;
        });
    }
};

/**
 * Used to replace parameters received from client in required payload.
 */
B2.PARAMETERS.prototype.evalClientPayload = function (intent, bestMatch, payloadConversation, callback) {
    B2.util.log.debug("Evaluating Payload: [payloadFromClient=" + JSON.stringify(payloadConversation) + "]", { line: __line });

    var payload = bestMatch.knowledge._source.payload;
    
    if (payload == undefined) {
        B2.util.log.debug("Evaluating Payload: [payload == undefined]", { line: __line });
        payload = JSON.stringify(payloadConversation);
    } else {
        var removeAccent = JSON.stringify(bestMatch.knowledge._source.removeAccent);

        var keys = Object.keys(payloadConversation);
        B2.util.log.debug("Evaluating Payload: [Total Keys=" + keys.length + "]", { line: __line });

        for (var i = 0; i < keys.length; i++) {
            var key   = keys[i];
            var value = payloadConversation[key].response;

            B2.util.log.debug("Match: [" + key + "=" + value + "]", { line: __line });
            payload = payload.replace("$" + key, value.trim());
            B2.util.log.debug("Payload: " + payload, { line: __line });

            if (removeAccent != undefined) {
                removeAccent = eval(removeAccent);
                if (removeAccent) {
                    var parsers = B2.getModule("PARSERS", core);
                    payload = parsers.removeAccent(payload);
                }
            }
        }
    }

    if (callback) {
        callback(payload);
    } else {
        return payload;
    }
};  

/**
 * This method is used to extract all parameters and prepare the payload base.
 */
B2.PARAMETERS.prototype.extractParameters = function (intent, bestMatch, payloadConversation, context, callback) {
    var _self    = this;
    var conversation = undefined;

    B2.util.log.debug("Extracting Payload: [payloadFromClient=" + JSON.stringify(payloadConversation) + "]", { line: __line });
    B2.util.log.debug("Extracting Payload: [intent=" + JSON.stringify(intent) + "]", { line: __line });

    var payload = bestMatch.knowledge._source.payload;
    
    if (payload == undefined) {
        B2.util.log.debug("Extracting Payload: [payload == undefined]", { line: __line });
        if (payloadConversation != undefined) {
            B2.util.log.debug("Extracting Payload: [payloadConversation != undefined]", { line: __line });
            payload = JSON.stringify(payloadConversation);
        }        
    } else {
        if (payloadConversation != undefined) {
            try {
                payloadConversation = JSON.parse(payloadConversation);
            } catch (e) {}            
        }

        var parameters = bestMatch.knowledge._source.parameters;
        var entities   = bestMatch._entities;
        
        parameters.forEach(function(e) {
            var payloadPosition          = e.payloadPosition;
            var name                     = e.name;
            var regexList                = e.regexList;
            var defaultValue             = e.defaultValue;
            var validationSuccessMessage = e.validationSuccessMessage;
            var validationErrorMessage   = e.validationErrorMessage;
            var richResponseObject       = e.richResponseObject;
            var validation               = e.validation;
            var evaluatedValue           = undefined;
            var ctxInjection             = (e.ctxInjection === undefined ? false : e.ctxInjection);

            if (payloadConversation != undefined) {
                if (payloadConversation[name]) {
                    if (payloadConversation[name] !== undefined) {
                        evaluatedValue = payloadConversation[name].response;
                    }                    
                }

                if (payloadConversation[payloadPosition]) {
                    if (evaluatedValue == "$" + payloadPosition) {
                        evaluatedValue = undefined;
                    }                        

                    if (evaluatedValue == undefined) {
                        if (payloadConversation[payloadPosition] !== undefined) {
                            evaluatedValue = payloadConversation[payloadPosition].response;
                        }    
                    }                    
                }
            }                

            var noMatchAsk      = e.noMatchAsk;
            var matched         = false; // Default Value for regex validations
            var value           = undefined;
            var match;
            var entityMatched = false;

            // Entity search
            if (entities != undefined) {
                if (entities[name] != undefined) {
                    value = entities[name].value;
                    B2.util.log.debug("Extracting Payload: Parameter [name=" + name + ", entityFound='" + value + "']", { line: __line });
                    entityMatched = true;
                }
            }

            if (!entityMatched) {
                B2.util.log.debug("Extracting Payload: Parameter [payloadPosition='" + payloadPosition + "', name=" + name + ", defaultValue='" + defaultValue + "', evaluatedValue='" + evaluatedValue + "']", { line: __line });
                
                if (regexList !== undefined) {
                    regexList.forEach(function(r) {
                        if (!matched) {
                            var regex = eval(r);
                            match = regex.exec(intent);                

                            if (match != null) {
                                B2.util.log.debug("Extracting Payload: Testing Regex [regex='" + r + "', total=" + match.length + ",result='" + match[1] + "']", { line: __line });
                                matched = true;
                                return;
                            } else {
                                B2.util.log.debug("Extracting Payload: Testing Regex [regex='" + r + "',result='" + match + "']", { line: __line });
                            }
                        }
                    });
                }

                if (matched) {
                    value = match[1].trim();
                } else { // No regex matched sucess
                    if (evaluatedValue != undefined) {
                        value = evaluatedValue;
                    } else {
                        // Inject Value From Context
                        if (ctxInjection) {
                            if (context[0] !== undefined) {
                                if (context[0].entities !== undefined) {
                                    if (context[0].entities[name] !== undefined) {
                                        if (context[0].entities[name].value !== undefined) {
                                            value = context[0].entities[name].value;
                                            B2.util.log.debug("Extracting Entity From Context. Parameter [name=" + name + ", contextFound='" + value + "']", { line: __line });
                                        }
                                    }
                                }

                                if (context[0].payload !== undefined) {
                                    if (context[0].payload[payloadPosition] !== undefined) {
                                        if (context[0].payload[payloadPosition].response !== undefined) {
                                            value = context[0].payload[payloadPosition].response;
                                            B2.util.log.debug("Extracting Payload From Context. Parameter [name=" + name + ", contextFound='" + value + "']", { line: __line });
                                        }
                                    }

                                    if (context[0].payload[name] !== undefined) {
                                        if (context[0].payload[name] !== undefined) {
                                            if (context[0].payload[name].response !== undefined) {
                                                value = context[0].payload[name].response;
                                            } else {
                                                value = context[0].payload[name];
                                            }
                                            
                                            B2.util.log.debug("Extracting Payload From Context. Parameter [name=" + name + ", contextFound='" + value + "']", { line: __line });
                                        }
                                    }                                    
                                }                                    
                            }
                        }

                        if (value === undefined) {
                            if (defaultValue == undefined) { // No Default Value Found, need to ask something.
                                if (conversation == undefined) {
                                    conversation      = {};
                                    conversation.sync = {}
                                }
                                conversation._id              = bestMatch.knowledge._id;
                                conversation.generateReturn   = true;                                

                                if (conversation.sync == undefined)
                                    conversation.sync = {};
                                conversation.sync[name] = {}

                                conversation.sync[name].payloadPosition  = payloadPosition;

                                if (validation != undefined)
                                    conversation.sync[name].validation = validation;

                                if (richResponseObject != undefined)
                                    conversation.sync[name].richResponseObject = richResponseObject;                                    

                                var noMatchAskResponse = B2.getModule("PRODUCERS", core).getBestResponse(noMatchAsk);
                                conversation.sync[name].ask = noMatchAskResponse;

                                if (validationSuccessMessage != undefined) {
                                    var validationSuccessMessageResponse = B2.getModule("PRODUCERS", core).getBestResponse(validationSuccessMessage);
                                    conversation.sync[name].validationSuccessMessage = [];
                                    conversation.sync[name].validationSuccessMessage.push(validationSuccessMessageResponse);                                    
                                }
                                if (validationErrorMessage != undefined) {
                                    var validationSuccessErrorResponse = B2.getModule("PRODUCERS", core).getBestResponse(validationErrorMessage);
                                    conversation.sync[name].validationErrorMessage = [];
                                    conversation.sync[name].validationErrorMessage.push(validationSuccessErrorResponse);
                                }
                            } else {
                                try {
                                    value = eval(defaultValue);
                                    B2.util.log.debug("Extracting Payload: Parameter [payloadPosition='" + payloadPosition + "', name=" + name + ", defaultValue='" + defaultValue + "', evaluatedValue='" + value + "']", { line: __line });
                                } catch (e) {
                                    B2.util.log.error("Extracting Payload: Error parsing dynamic value [defaultValue=" + defaultValue + "]", { line: __line });
                                }
                            }
                        }
                    }
                }
            }

            payload = payload.replace("$" + payloadPosition, value);
        });
    }

    if (conversation != undefined) {
        var response = {};
        response.conversation = conversation;
        _self.emit('moreInformationNeeded', response);
        return;
    } else {
        try {
            payload = JSON.parse(payload);
        } catch (e){}

        if (payload !== undefined) {
            payload.context = context;
        }
        
        _self.emit('extractionComplete', payload);
        return;
    }

};

module.exports = B2.PARAMETERS;