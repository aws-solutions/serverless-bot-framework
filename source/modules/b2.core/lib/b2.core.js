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
var natural = require('natural');
var _       = require('underscore');
var moment  = require('moment');
var db = undefined;
var combinatorics = require('js-combinatorics');

B2.CORE = function () {Emitter.call(this);}
util.inherits(B2.CORE, Emitter)
var instance;

B2.CORE.getInstance = function () {
    instance = new B2.CORE();
    instance.startRequest();
    
    return instance;
};

B2.CORE.prototype.metrics   = {}
B2.CORE.prototype.event     = {}
B2.CORE.prototype.instances = []

B2.CORE.prototype.startRequest = function () {
    var _self = this;
    _self.metrics = {};
    _self.metrics.startTime         = new Date().getTime();
    _self.metrics.startTimeReadable = new Date().toString();
    _self.metrics.monthIdx          = moment().format('YYYYMM');
    _self.metrics.dayIdx            = moment().format('YYYYMMDD');
};

B2.CORE.prototype.endRequest = function () {
    var _self = this;
    _self.metrics.endTime         = new Date().getTime();
    _self.metrics.endTimeReadable = new Date().toString();
    _self.metrics.totalTime       = _self.metrics.endTime - _self.metrics.startTime;

    _self.persistConversation(_self.metrics.startTime, _self.metrics, function(){
        _self.persistContext(_self.metrics.startTime, _self.metrics, function(){            
        });
        _self.emit('completed', _self.metrics);
    }); 
};

B2.CORE.prototype.getSessionID = function () {
    const uuidv1 = require('uuid/v1');
    var sID = uuidv1();
    return sID;
};

B2.CORE.prototype.loadExtensions = function () {
    var _self = this;
    return _self;
};

B2.CORE.prototype.resolveIntent = function (intent, callback) {
    var _self = this;
    var sessionID = intent.sessionID;
    var lang      = intent.lang;

    if (sessionID == undefined) {
        sessionID = _self.getSessionID();
        intent.sessionID = sessionID;
    }

    var uid       = sessionID.toString() + "-" + _self.metrics.startTime;

    var event   = intent;
    event.uid   = uid;
    _self.event = event;
    _self.metrics.sessionID = sessionID;
    _self.metrics.event = intent;
    _self.metrics.lang  = _self.event.lang;
    _self.metrics.origin = event.origin;
    _self.metrics.testMode = event.testMode;
    _self.metrics.testType = event.testType;

    B2.util.log.info("Resolving Intent [" + JSON.stringify(intent) + "]", { line: __line });
    
    if (callback) {callback();}
    var rawIntent = intent.text;

    // If intent type is an object call another method
    if (B2.CORE.getIntentType(intent) == B2.intentTypes.OBJECT) {
        B2.util.log.info("Resolving Intent Object [" + JSON.stringify(intent) + "]", { line: __line });
        _self.resolveIntentObject(intent, intent.payload, callback);
        return;
    }

    var intent    = intent.text;
    _self.metrics.intentBeforeParsers = intent;
    _self.metrics.environmentVars = event.environmentVars;

    // Call pre-operation extension.
    B2.util.log.debug("Intent BEFORE Callback beforeParseExtension [" + intent + "]", { line: __line });
    if (B2.ext['beforeParseExtension']) {
        try {
            intent = B2.ext['beforeParseExtension'](intent);
        } catch (e) {
            B2.util.log.error("Error Running Callback [callback=beforeParseExtension, error=" + e + "]", { line: __line });
        }
    }
    B2.util.log.info("Intent After Callback beforeParseExtension [" + intent + "]", { line: __line });

    var processKnowledge = function(entities, intent){
        B2.getModule("BRAIN", instance, function(brain){
            var startBrainTime = new Date().getTime();

            var intentArray = [];

            var t = brain.tokenizer(intent);

            if (B2.BRAIN.statistics) {
                var tokenizer = new natural.RegexpTokenizer({pattern: / /});
                var NGrams    = natural.NGrams;
                NGrams.setTokenizer(tokenizer);
    
                var grams = NGrams.ngrams(intent, Math.round(B2.BRAIN.statistics.tfidf.score.avgWordIntentModel));
                
                grams.forEach(function(g){
                    B2.util.log.debug("NGrams " + Math.round(B2.BRAIN.statistics.tfidf.score.avgWordIntentModel) + ": " + g, { line: __line });
                    var iNgram = g.join(" ");                    
                });
    
                if (!_.contains(intentArray, intent)) {
                    intentArray.push(intent);
                }
            }

            if (entities.length > 0) {
                // Cartesian Product            
                var groupedEntities = _.groupBy(entities, 'type');
                var reducedEntities = [];

                function hasItem (list, i) {
                    var retorno = false;

                    list.forEach(l => {
                        if (l.indexOf(i) > -1) {
                            if (l != i)
                                retorno = true;
                        }                            
                    })

                    return retorno;
                }

                // Reduce entities
                Object.keys(groupedEntities).forEach(function(key){
                    var tmpValues = [];
                    var values    = _.sortBy(groupedEntities[key], 'len');

                    values = _.chain(values).reverse().value();

                    values.forEach(element => {
                        var v = element.value;

                        if (!hasItem(tmpValues, v)) {
                            tmpValues.push(v);
                            reducedEntities.push(element);
                        }
                    });
                });

                groupedEntities = _.groupBy(reducedEntities, 'value');
                reducedEntities = [];

                // Reduce entities
                Object.keys(groupedEntities).forEach(function(key){
                    var tmpValues = [];
                    var values    = _.sortBy(groupedEntities[key], 'len');

                    values = _.chain(values).reverse().value();

                    values.forEach(element => {
                        var v = element.value;

                        if (!hasItem(tmpValues, v)) {
                            tmpValues.push(v);
                            reducedEntities.push(element);
                        }        
                    });
                });            

                var cp;
                var add = "";

                groupedEntities = _.groupBy(reducedEntities, 'value');

                Object.keys(groupedEntities).forEach(function(key){
                    var g = groupedEntities[key];

                    add = add + "[";

                    g.forEach(function(element){
                        add = add + "'" + element.type + ':::' +  element.value + "',";
                    });
                    
                    add = add.slice(0, -1);
                    add = add + "],";
                });
                add = add.slice(0, -1);

                add = "combinatorics.cartesianProduct(" + add + ")"; 

                cp = eval(add);
                var arrayPossibilities = cp.toArray();

                arrayPossibilities.forEach(poss => {
                    var tmpIntent = intent;

                    poss.forEach(p => {
                        var split_poss = p.split(":::");
                        var type       = split_poss[0];
                        var value      = split_poss[1];
        
                        tmpIntent = tmpIntent.replace(value, "{" + type + "}");                    
                    });

                    intentArray.push(tmpIntent);    
                });
                B2.util.log.silly("Intent Array [" + intentArray + "]", { line: __line });
            }

            brain.getKnowledge(intentArray, function(c){    
                var keys = Object.keys(c);
                var totalKnowledge = keys.length;
                B2.util.log.info("Total of Knowledge Found [" + totalKnowledge + "]", { line: __line });
                _self.metrics.totalKnowledgeFound = totalKnowledge;
                _self.metrics.classificationResults = c;
                console.log('===== brain.getknowldge');
                var producers = B2.getModule("PRODUCERS", instance);

                function returnFilledDefaultResponse(response, bestMatch) {
                    console.log('===== inside returnFilledDefaultResponse');
                    response.rawIntent    = rawIntent;
                    response.userInfo = event.userInfo;
                    response.environmentVars = event.environmentVars;
                    response.sessionID    = event.sessionID;
                    response.uid          = event.uid;
                    response.lang         = event.lang;                                
                    response.version      = B2.VERSION;
                    response.temporalEntities = _self.metrics.temporalEntities;

                    response.desiredMatch = _self.metrics.desiredMatch;

                    if (response.voice == undefined) {
                        response.voice        = B2.configs.voice;

                        if (bestMatch) {
                            response.customPronunciation = bestMatch.knowledge._source.customPronunciation;

                            if (bestMatch.knowledge._source.voice !== undefined)
                                response.voice = bestMatch.knowledge._source.voice;
                        }
                    }

                    return response;
                }

                // Used to Return Best Match of Knowledge
                brain.getBestMatch(c, function (bestMatch) {
                    if (bestMatch == undefined) {
                        // Test if intent is entity only
                        if (intent.length == 0) {
                            B2.util.log.info(":( Only Entities found in Intent. [entities=" + JSON.stringify(entities) + "]", { line: __line });

                            var keys = Object.keys(entities);

                            var payload = {};
                            keys.forEach(function(e){
                                if (entities[e].knowledge[0] !== undefined)
                                    _self.event._id = entities[e].knowledge[0];
                                
                                payload[e] = entities[e].value;                                
                            });                                                    

                            if (_self.event._id !== undefined) {
                                B2.util.log.info("Only Entities Flow. [routingTo=" + JSON.stringify(_self.event) + "]", { line: __line });
                                _self.event.routedEvent = "ENTITY_ONLY";
                                _self.entities = entities;
                                _self.resolveIntentObject(_self.event, payload);
                                return;
                            }
                        }

                        // Data Enrichment
                        var dataEnrichment = B2.getModule("ENRICHMENT", instance);
                        var tags = dataEnrichment.runStack(['sentiment','negativeWords','positiveWords','qualitativeWords','quantitativeWords','temporalWords'], intent);
                        _self.metrics.tags = tags;
                        B2.util.log.info("Data Enrichment TAGS [intent=" + intent + ", tags=" + tags + "]", { line: __line });

                        var response = {};
                        response = returnFilledDefaultResponse(response, bestMatch);
                        response.nif          = true;
                        response.entities     = entities;

                        if (response.tags === undefined)
                            response.tags     = [];
                        response.tags         = _.extend(response.tags, _self.metrics.tags);        

                        response.text = ":(";
                        response.speech = "Error";

                        if (B2.i18n.nifMessage !== undefined) {
                            response.text         = B2.i18n.nifMessage.text;
                            response.speech       = B2.i18n.nifMessage.speech;
                        }

                        response.endConversation = true;

                        // Check total of last NIFs
                        var ctx = B2.getModule("CTX", instance);
                        ctx.getConversationBySessionID(sessionID, 2)
                        .then(function(conversations){
                            var totalNifs = 1;

                            conversations.forEach(function(c){
                                if (c.nif) {
                                    totalNifs = totalNifs + 1;
                                }
                            });

                            // Check routeNif
                            if (B2.BRAIN.routeDefinitions !== undefined) {
                                if (totalNifs >= 3) {
                                    B2.util.log.warn("Sequencial NIFs Limit [total=" + totalNifs + "]", { line: __line });

                                    if (B2.BRAIN.routeDefinitions.nifLimitRouter !== undefined) {
                                        response.endConversation = false;
                                        response.router = B2.BRAIN.routeDefinitions.nifLimitRouter;
                                        
                                        if (response.router.mode === "text") {
                                            response.text = response.router.text;
                                            response.speech = response.router.speech;
                                        }
    
                                        _self.event.routedEvent = "ROUTER_NIF_LIMIT";
                                    } else { // No Special NIF Limit Router
                                        if (B2.BRAIN.routeDefinitions.nifRouter !== undefined) {
                                            response.endConversation = false;
                                            response.router = B2.BRAIN.routeDefinitions.nifRouter;
                                            
                                            if (response.router.mode === "text") {
                                                response.text = response.router.text;
                                                response.speech = response.router.speech;
                                            }
        
                                            _self.event.routedEvent = "ROUTER_NIF";
                                        }    
                                    }
                                } else {
                                    if (B2.BRAIN.routeDefinitions.nifRouter !== undefined) {
                                        response.endConversation = false;
                                        response.router = B2.BRAIN.routeDefinitions.nifRouter;
                                        
                                        if (response.router.mode === "text") {
                                            response.text = response.router.text;
                                            response.speech = response.router.speech;
                                        }
    
                                        _self.event.routedEvent = "ROUTER_NIF";
                                    }
                                }

                                response = producers.executeCallbacks(response);
                                
                                _self.metrics.nif = true;
                                _self.metrics.totalBrainTime = new Date().getTime() - startBrainTime;
                                _self.metrics.response = response;
                                _self.emit('noIntentFound', response);                                
                            } else {
                                var http = require('http');
                                var AWS  = require('aws-sdk');
                                
                                if (B2.BRAIN.federation == undefined) {
                                    _self.metrics.nif = true;
                                    _self.metrics.totalBrainTime = new Date().getTime() - startBrainTime;
                                    _self.metrics.response = response;
                                    _self.emit('noIntentFound', response);                                
                                    return;
                                }

                                // Try to use federated knowledge
                                var fed = B2.getModule("FEDERATION", instance);

                                var federatedBrains = Object.keys(B2.BRAIN.federation);
                                var firstbrain      = B2.BRAIN.federation[federatedBrains[0]];

                                event.origin = federatedBrains[0];

                                fed.callFederatedBrain(firstbrain, event)
                                .then(function(response){
                                    _self.metrics.totalBrainTime = new Date().getTime() - startBrainTime;
                                    _self.metrics.response = response;
                                    _self.emit('federated', response);
                                });
                            }                
                        });
                    } else {
                        bestMatch._entities = entities;
                        bestMatch._temporalEntities = _self.metrics.temporalEntities;

                        _self.metrics.bestMatch = bestMatch;
                        _self.metrics.totalBrainTime = new Date().getTime() - startBrainTime;

                        // Data Enrichment
                        var dataEnrichment = B2.getModule("ENRICHMENT", instance);
                        var tags = dataEnrichment.runStack(['sentiment','negativeWords','positiveWords','qualitativeWords','quantitativeWords','temporalWords'], intent);
                        _self.metrics.tags = tags;
                        bestMatch._tags    = tags;

                        B2.util.log.debug("Data Enrichment TAGS [intent=" + intent + ", tags=" + tags + "]", { line: __line });

                        // Recover ctx
                        var ctx = B2.getModule("CTX", instance);
                        ctx.getContextBySessionID(sessionID, 3)
                        .then(function(context){
                            B2.util.log.debug("Context Found [context=" + JSON.stringify(context) + "]", { line: __line });
                            _self.metrics.context = context;

                            // Used to produce a JSON with the correct format
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.SIMPLE) {
                                var startSRTime = new Date().getTime();

                                producers.simpleResponse(bestMatch, function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);                                    
                                    response.entities     = entities;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);   

                                    if (bestMatch.knowledge._source.router !== undefined) {
                                        response.router = bestMatch.knowledge._source.router;
                                            
                                        _self.event.routedEvent = "ROUTER_KNOWLEDGE";
                                    }

                                    _self.metrics.totalSimpleResponseTime = new Date().getTime() - startSRTime;
                                    _self.metrics.response = response;
                                    _self.emit('simpleResponse', response);                         
                                });
                            }

                            // Command
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.COMMAND) {
                                var startSRTime = new Date().getTime();

                                producers.simpleResponse(bestMatch, function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.command      = bestMatch.knowledge._source.command
                                    response.commandID    = bestMatch.knowledge._source.commandID
                                    response.entities     = entities;
                                    response.userInfo = event.userInfo;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);

                                    _self.metrics.totalSimpleResponseTime = new Date().getTime() - startSRTime;
                                    _self.metrics.response = response;
                                    _self.emit('simpleResponse', response);
                                });
                            }

                            // Backend call
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.LAMBDA) {
                                var startLambdaTime = new Date().getTime();

                                // If cannot extract some parameter, ask something.
                                producers.on('moreInformationNeeded', function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.entities     = entities;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);

                                    _self.metrics.response = response;                            
                                    _self.emit('moreInformationNeeded', response);
                                });

                                producers.backendResponse(intent, bestMatch, function(response, payload){
                                    B2.util.log.info("Backend Response [intent=" + intent + ", response=" + JSON.stringify(response) + "]", { line: __line });
                                    
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.userInfo = event.userInfo;
                                    response.entities     = entities;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);                                

                                    if (bestMatch.knowledge._source.router !== undefined) {
                                        response.router = bestMatch.knowledge._source.router;
                                            
                                        _self.event.routedEvent = "ROUTER_KNOWLEDGE";
                                    }

                                    _self.metrics.totalLambdaTime = new Date().getTime() - startLambdaTime;
                                    _self.metrics.response = response;
                                    _self.metrics.payload = payload;

                                    _self.emit('backendResponse', response);
                                });
                            }

                            // Used to produce a JSON with the correct format
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.HISTORY) {
                                var startHistoryTime = new Date().getTime();

                                producers.history(bestMatch, function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.entities     = entities;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);

                                    if (bestMatch.knowledge._source.router !== undefined) {
                                        response.router = bestMatch.knowledge._source.router;
                                            
                                        _self.event.routedEvent = "ROUTER_KNOWLEDGE";
                                    }

                                    _self.metrics.totalHistoryTime = new Date().getTime() - startHistoryTime;
                                    _self.metrics.response = response;
                                    _self.emit('history', response);
                                });
                            }

                            // Sync - Used to produce a JSON with the correct format
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.SYNC) {
                                var startSyncTime = new Date().getTime();

                                producers.syncConversation(bestMatch, function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.entities     = entities;
                                    response.userInfo = event.userInfo;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);
                                    
                                    _self.metrics.totalSyncTime = new Date().getTime() - startSyncTime;
                                    _self.metrics.response = response;
                                    _self.emit('syncConversation', response);
                                });
                            }

                            // Async - Used to produce a JSON with the correct format
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.ASYNC) {
                                var startAsyncTime = new Date().getTime();

                                producers.asyncConversation(bestMatch, function(response){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.userInfo = event.userInfo;
                                    response.entities     = entities;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);

                                    _self.metrics.totalAsyncTime = new Date().getTime() - startAsyncTime;
                                    _self.metrics.response = response;
                                    _self.emit('asyncConversation', response);
                                });
                            }   
                            
                            if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.TREE) {
                                var startTreeTime = new Date().getTime();

                                producers.treeConversation(intent, bestMatch, function(response, payload){
                                    response = returnFilledDefaultResponse(response, bestMatch);
                                    response.entities     = entities;
                                    response.userInfo = event.userInfo;
                                    if (response.tags === undefined)
                                        response.tags     = [];
                                    response.tags         = _.extend(response.tags, _self.metrics.tags);
                                    
                                    _self.metrics.totalTreeTime = new Date().getTime() - startTreeTime;
                                    _self.metrics.response = response;
                                    _self.emit('asyncConversation', response);
                                });
                            }                                                    
                        });
                    }
                });
            });
        });
    };

    // Entity Resolver
    B2.getModule("BRAIN", instance).loadKnowledge(function(){
        B2.getModule("PARAMETERS", instance, function(parameters){
            _self.metrics.entities = [];

            var entityEngine = B2.getModule("ENTITY", instance);

            // Run Parsers Stack
            var startParserTime = new Date().getTime();
            var parsers = B2.getModule("PARSERS", instance);

            var parserStack = B2.PARSERS.defaultStack;

            if (B2.configs.parserStack !== undefined) {
                parserStack = B2.configs.parserStack;
            }

            intent = parsers.runParserStack(parserStack, intent);
            
            B2.util.log.info("Intent After Parsers [" + intent + "]", { line: __line });
            
            _self.metrics.intentAfterParsers = intent;

            var endParserTime = new Date().getTime();
            _self.metrics.totalParserTime = endParserTime - startParserTime;

            var startEntityResolver = new Date().getTime();

            entityEngine.entityResolver(intent, function(entitiesResult){
                var endEntityResolver = new Date().getTime();
                _self.metrics.totalEntityResolverTime = endEntityResolver - startEntityResolver;

                var entities = _self.metrics.entities.concat(entitiesResult);

                _self.metrics.entities = entities;

                parsers.entityCleanUP(intent, entities, function(i){
                    _self.metrics.noEntityIntent = i;

                    B2.util.log.info("Intent After Entity Cleanup Parser [" + i + "]", { line: __line });
                    
                    processKnowledge(entities, intent);
                });                
            });
        });    
    });
};

/**
 * Used to resolve knowledge base on id direct calls.
 */
B2.CORE.prototype.resolveIntentObject = function (intent, payload, callback) {
    var _self = this;
    var _id = intent._id;
    payload.userInfo = _self.event.userInfo;

    var rawIntent = intent.rawIntent;

    B2.getModule("BRAIN", instance, function(brain){
        brain.getKnowledgeByID(_id, function(bestMatch){
            bestMatch._entities = intent.entities;
            var producers = B2.getModule("PRODUCERS", instance);

            function returnFilledDefaultResponse(response, bestMatch) {
                response.rawIntent    = intent;    
                response.environmentVars = intent.environmentVars;
                response.sessionID    = intent.sessionID;
                response.uid          = intent.uid;
                response.lang         = intent.lang;                                
                response.version      = B2.VERSION;

                response.desiredMatch = _self.metrics.desiredMatch;

                if (response.voice == undefined) {
                    response.voice = B2.configs.voice;

                    if (bestMatch) {
                        response.customPronunciation = bestMatch.knowledge._source.customPronunciation;
    
                        if (bestMatch.knowledge._source.voice !== undefined)
                            response.voice = bestMatch.knowledge._source.voice;
                    }
                }

                return response;
            }

            // Recover ctx
            var ctx = B2.getModule("CTX", instance);
            ctx.getContextBySessionID(_self.metrics.sessionID, 1)
            .then(function(context){
                B2.util.log.debug("Context Found [context=" + JSON.stringify(context) + "]", { line: __line });
                _self.metrics.context = context;
            
                if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.TREE) {
                    var startTreeTime = new Date().getTime();
                    
                    _self.metrics.bestMatch       = bestMatch;
                    _self.metrics.environmentVars = intent.environmentVars;

                    var dataEnrichment = B2.getModule("ENRICHMENT", instance);
                    var tags = dataEnrichment.runStack(['sentiment','negativeWords','positiveWords','qualitativeWords','quantitativeWords','temporalWords'], rawIntent);
                    _self.metrics.tags = tags;
                    B2.util.log.info("Data Enrichment TAGS [intent=" + JSON.stringify(intent) + ", tags=" + tags + "]", { line: __line });

                    producers.treeConversation(intent, bestMatch, function(response){
                        response = returnFilledDefaultResponse(response, bestMatch);
                        response.entities     = _self.entities;
                        if (response.tags === undefined)
                            response.tags     = [];
                        response.tags         = _.extend(response.tags, _self.metrics.tags);

                        _self.metrics.totalTreeTime = new Date().getTime() - startTreeTime;
                        _self.metrics.response = response;
                        _self.emit('asyncConversation', response);
                    }, payload);
                }

                if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.LAMBDA) {
                    var startLambdaTime = new Date().getTime();

                    _self.metrics.bestMatch       = bestMatch;
                    _self.metrics.environmentVars = intent.environmentVars;

                    var dataEnrichment = B2.getModule("ENRICHMENT", instance);
                    var tags = dataEnrichment.runStack(['sentiment','negativeWords','positiveWords','qualitativeWords','quantitativeWords','temporalWords'], rawIntent);
                    _self.metrics.tags = tags;
                    B2.util.log.info("Data Enrichment TAGS [intent=" + JSON.stringify(intent) + ", tags=" + tags + "]", { line: __line });

                    producers.on('moreInformationNeeded', function(response){
                        response = returnFilledDefaultResponse(response, bestMatch);
                        response.entities     = _self.entities;
                        if (response.tags === undefined)
                            response.tags     = [];
                        response.tags         = _.extend(response.tags, _self.metrics.tags);

                        _self.metrics.response = response;                            
                        _self.emit('moreInformationNeeded', response);
                    });

                    producers.backendResponse(intent, bestMatch, function(response){
                        B2.util.log.info("Backend Response [intent=" + JSON.stringify(intent) + ", response=" + JSON.stringify(response) + "]", { line: __line });
                        response = returnFilledDefaultResponse(response, bestMatch);
                        response.entities     = _self.entities;
                        response.userInfo = _self.event.userInfo;
                        if (response.tags === undefined)
                            response.tags     = [];
                        response.tags         = _.extend(response.tags, _self.metrics.tags);

                        _self.metrics.totalLambdaTime = new Date().getTime() - startLambdaTime;
                        _self.metrics.response = response;
                        _self.metrics.payload = intent.payload;

                        _self.emit('backendResponse', response);                
                    }, payload);
                }

                // Used to produce a JSON with the correct format
                if (B2.CORE.getResponseType(bestMatch) == B2.responseTypes.SIMPLE) {
                    var startSRTime = new Date().getTime();

                    producers.simpleResponse(bestMatch, function(response){
                        response = returnFilledDefaultResponse(response, bestMatch);                                    
                        if (response.tags === undefined)
                            response.tags     = [];
                        response.tags         = _.extend(response.tags, _self.metrics.tags);   

                        if (bestMatch.knowledge._source.router !== undefined) {
                            response.router = bestMatch.knowledge._source.router;
                                
                            _self.event.routedEvent = "ROUTER_KNOWLEDGE";
                        }

                        _self.metrics.totalSimpleResponseTime = new Date().getTime() - startSRTime;
                        _self.metrics.response = response;
                        _self.emit('simpleResponse', response);                         
                    });
                }                   
            });
        });
    });
};

B2.CORE.prototype.checkIfVoiceIsNeeded = function (event, backendResponse, callback) {
    var _self = this;
    var data  = backendResponse;

    if (backendResponse.binary !== undefined) {
        B2.util.log.debug("Using binary from backendResponse..", { line: __line });
        if (callback) {
            callback(backendResponse);
            return;
        }        
    }

    if ((event.pollyOnServer) || (event.pollyOnServer === "true") || (event.pollyOnServer === "True")) {
        try {
            if (data.speech == undefined) {
                if (callback) {
                    callback(data);
                    return;
                }
            }

            if (data.voice == undefined) {
                data.voice = B2.configs.voice;
            }

            // Cache Improvements
            var hashBase = data.voice + "|" + data.speech + "|" + data.customPronunciation;
            var hashCode = B2.generateHashCode(hashBase);
            
            var startPollyTimeCache = new Date().getTime();
            B2.getAudioFromCache(hashCode, function(binary){
                if (binary !== undefined) {                    
                    data.binary   = binary;
                    data.hashBase = hashCode;
                    data.cacheHit = true;
                    _self.metrics.totalPollyTimeCache = new Date().getTime() - startPollyTimeCache;
                    _self.metrics.pollyCacheHit = true;

                    if (callback) {
                        callback(data);
                    }                    
                } else {
                    var startPollyTime = new Date().getTime();
                    B2.getModule("AWS", instance, function(aws){
                        aws.polly.speech(data.speech, data.voice, function(voiceBinary) {
                            var b64encoded = new Buffer(voiceBinary.AudioStream).toString('base64');
                            data.binary    = b64encoded;
                            data.hashBase  = hashCode;
                            data.cacheHit  = false;

                            _self.metrics.totalPollyTime      = new Date().getTime() - startPollyTime;
                            _self.metrics.totalPollyTimeCache = new Date().getTime() - startPollyTimeCache;
                            _self.metrics.pollyCacheHit       = false;

                            if (callback) {
                                callback(data);
                            }
                            B2.saveAudioCache(hashCode, b64encoded);
                        });
                    }, data.customPronunciation);
                }
            });
        } catch (e) {B2.util.log.debug("Error Calling Polly Service [" + e.stack + "]", { line: __line });}
    } else {
        if (callback) {
            callback(data);
        }
    }
};

B2.CORE.getIntentType = function (intent, callback) {
    var type = undefined;

    if (intent._id == undefined) {
      type = B2.intentTypes.STRING;
    }

    if (intent._id != undefined) {
      type = B2.intentTypes.OBJECT;
    }

    if (callback) {
        callback(type);
    } else {
        return type;
    }
};

B2.CORE.getObjType = function (text, callback) {
    var type = undefined;

    try {
        text = JSON.parse(text);
    } catch (e) {}
    

    if (typeof text == "string") {
      type = B2.objTypes.STRING;
    }

    if (typeof text != "string") {
      type = B2.objTypes.OBJECT;
    }

    if (callback) {
        callback(type);
    } else {
        return type;
    }
};

B2.CORE.getResponseType = function (response, callback) {
    var type = undefined;

    if (!response.knowledge._source)
        response.knowledge = B2.BRAIN.kbm[response.knowledge];

    if (response.knowledge._source.nodes != undefined) {
        type = B2.responseTypes.TREE;
      }

    if (response.knowledge._source.response != undefined) {
      type = B2.responseTypes.SIMPLE;
    }

    if (response.knowledge._source.arn != undefined) {
      type = B2.responseTypes.LAMBDA;
    }

    if (response.knowledge._source.history != undefined) {
      type = B2.responseTypes.HISTORY;
    }    

    if (response.knowledge._source.syncConversation != undefined) {
      type = B2.responseTypes.SYNC;
    }    

    if (response.knowledge._source.asyncConversation != undefined) {
      type = B2.responseTypes.ASYNC;
    }

    if (response.knowledge._source.command != undefined) {
      type = B2.responseTypes.COMMAND;
    }

    B2.util.log.silly("Response Type [" + type + "]", { line: __line });

    if (callback) {
        callback(type);
    } else {
        return type;
    }
};

B2.CORE.getBackendService = function (arn, callback) {
    var type = B2.serviceTypes.LAMBDA;

    var s_arn = arn.split(":");

    if (s_arn.length > 1) {
        var service = s_arn[2];
        
        if (service.toLowerCase() == "lambda") {
            type = B2.serviceTypes.LAMBDA;
        }

        if (service.toLowerCase() == "states") {
            type = B2.serviceTypes.STEPFUNCTIONS;
        }        
    }

    if (callback) {
        callback(type);
    } else {
        return type;
    }    
};

B2.CORE.isAsyncConversation = function (response, callback) {
    response = JSON.parse(response);

    if (response.asyncConversation != undefined) {
        B2.util.log.debug("isAsyncConversation [" + JSON.stringify(response) + " = true]", { line: __line });
        return true;
    }

    B2.util.log.debug("isAsyncConversation [" + JSON.stringify(response) + " = false]", { line: __line });
    return false;
};

B2.CORE.cleanBinary = function (textObject) {
    var textResult = JSON.stringify(textObject);
    
    try {
        var regex = /\"(\/9j\/[^\"]*)\"/;
        var match = regex.exec(textResult);
    
        while (match = regex.exec(textResult)) {
          textResult = textResult.replace(match[0], "\"--binary replaced--\"");
        }
    
        // Clean empty Data
        regex = /(,\"\w+\":\"{2})/;
        match = regex.exec(textResult);
    
        while (match = regex.exec(textResult)) {
            textResult = textResult.replace(match[0], "");
        }
        textResult = JSON.parse(textResult);
    } catch (e) {
        B2.util.log.warn("error cleaning binary data [" + e + "]", { line: __line });
    }

    return textResult;
};

B2.CORE.prototype.persistConversation = function (key, item, callback) {
    var _self = this;

    var persistConversation = true;

    if (B2.configs.persistConversation !== undefined)
        persistConversation = B2.configs.persistConversation;

    if (db == undefined) {
        db = B2.getModule("AWS", instance).dynamo;
        _self.persistConversation(key, item, callback);
        return;
    }
    
    var table = B2.configs.conversationLogsTable;

    item.timestamp = key;
    item.uid       = item.sessionID.toString() + "-" + key;

    item = B2.CORE.cleanBinary(item);
    
    if ((item.bestMatch) && (item.bestMatch.knowledge)) {
        item.bestMatch.knowledge = item.bestMatch.knowledge._id;
    }
    
    if (item.classificationResults) {
        Object.keys(item.classificationResults).forEach(cr => {
            item.classificationResults[cr].knowledge = item.classificationResults[cr].knowledge._id;
        });
    }
        
    try {
        var tmp = {};
        tmp = JSON.stringify(item.response);
        tmp = JSON.parse(tmp);
        tmp.binary = undefined;
        item.response = tmp;
    } catch (e){ /*Non critical block. J will save conversation*/ }

    if (!persistConversation) {
        B2.util.log.debug("Persistency Conversation Disabled [content=" + JSON.stringify(item) + "]", { line: __line });
        if (callback) {
            callback();
        }        
        return;
    }

    try {
        db.create(table, item, function(err, data){
            if (err) {
                B2.util.log.error("Error Saving Conversation: " + err, { line: __line });
            } else {
                B2.util.log.debug("Conversation Saved to [table=" + table + ", content=" + JSON.stringify(item) + "]", { line: __line });
            }

            if (callback) {callback();}       
        });
    } catch (e){
        B2.util.log.error("Error Saving Conversation: " + e, { line: __line });
        if (callback) {callback();}        
    }
};

/**
 * Function used to save context informations in DynamoDB
 */
B2.CORE.prototype.persistContext = function (key, sessionID, callback) {
    var _self = this;

    if ((_self.metrics.nif !== undefined) && (_self.metrics.nif)) {
        if (callback) {
            callback(); return;
        } else {
            return;
        }
    }

    if ((_self.metrics.moreInformationNeeded !== undefined) && (_self.metrics.moreInformationNeeded)){
        if (callback) {
            callback(); return;
        } else {
            return;
        }
    }

    var payload = _self.metrics.payload;
    
    if (payload) {
        payload = B2.CORE.cleanBinary(payload);
    }

    var response = _self.metrics.response;

    if (response) {
        response = B2.CORE.cleanBinary(response);
    }

    B2.getModule("CTX", instance).createContext(key, _self.metrics.sessionID, _self.metrics.entities, payload, _self.metrics.bestMatch, response, _self.metrics.intentBeforeParsers, _self.metrics.environmentVars);
};

module.exports = B2.CORE;
