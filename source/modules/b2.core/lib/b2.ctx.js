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
var moment  = require('moment');

B2.CTX = {};
B2.CTX.DYNAMO = function () {Emitter.call(this);}
util.inherits(B2.CTX.DYNAMO, Emitter);

var instance;
var core;
var db = undefined;

B2.CTX.getInstance = function (coreInstance) {
    core = coreInstance;
    instance = new B2.CTX.DYNAMO();
    
    return instance;
};

/**
 * Function used to get the context based on SessionID
 */
B2.CTX.DYNAMO.prototype.getContextBySessionID = function (sessionID, limit) {
    var _self = this;
    var table = B2.configs.contextTable;
    sessionID = sessionID.toString();
    var ctxTTLLimit = 48;

    if (db == undefined) {
        db = B2.getModule("AWS", core).dynamo;
    }

    var contextSize = 1;

    if (B2.configs.ctxTTLLimit !== undefined) {
        ctxTTLLimit = B2.configs.ctxTTLLimit;
    }

    if (limit !== undefined) {
        contextSize = limit;
    }

    contextSize = (contextSize > 10 ? 1 : contextSize);

    return new Promise(function(resolve, reject) {
        var context = [];

        if (core.metrics.event.testMode)
            resolve(context);

        if (table == undefined) {
            resolve(context);
        }

        var startScanDate = moment();
        startScanDate.subtract(ctxTTLLimit,'hour');
        var millis = startScanDate.toDate().getTime();

        var params = {
            "TableName": table,
            "ConsistentRead": false,
            "IndexName": "sessionID-timestamp-index",
            "Limit": contextSize,
            "ScanIndexForward": false, 
            "KeyConditionExpression": "sessionID = :val AND #timestamp >= :timestamp",
            "ExpressionAttributeNames": {
                '#timestamp': 'timestamp'
            },            
            "ExpressionAttributeValues": {
                ":val": sessionID,
                ':timestamp': millis
            }
        };

        db.query(params, function(itemFound){
            var i = 0;
            itemFound.forEach(function(e) {
                B2.util.log.silly("Injected Context by SessionID [item=" + JSON.stringify(e) + "]", { line: __line });                
                context.push(e);
                i++;
            }, this);

            resolve(context);
        });
    });
}

/**
 * Function used to get the context based on Tags
 */
B2.CTX.DYNAMO.prototype.getContextByTags = function (sessionID, tags) {
    var _self = this;
    var table = B2.configs.contextTable;
    sessionID = sessionID.toString();
    var ctxTTLLimit = 48;

    if (db == undefined) {
        db = B2.getModule("AWS", core).dynamo;
    }

    if (B2.configs.ctxTTLLimit !== undefined) {
        ctxTTLLimit = B2.configs.ctxTTLLimit;
    }

    return new Promise(function(resolve, reject) {
        var context = [];

        if (table == undefined) {
            resolve(context);
        }

        if (tags === undefined) {
            resolve(context);
        }

        var values = {};
        var headerKeys = "(";
        var i = 1;

        tags.forEach(function(item){
            values[":val" + i] = item;
            headerKeys = headerKeys + "contains(knowledgeTags, " + ":val" + i + ") or ";
            i++;
        });

        // Last x hours to scan index.
        var startScanDate = moment();
        startScanDate.subtract(ctxTTLLimit,'hour');
        var millis = startScanDate.toDate().getTime();
        values[":millis"] = millis;
        values[":sessionID"] = sessionID;

        headerKeys = headerKeys.substring(0, headerKeys.length - 3);
        headerKeys = headerKeys + ") AND #timestamp >= :millis AND #sessionID = :sessionID"

        var params = {
            "TableName": table,
            "IndexName": "sessionID-timestamp-index",
            "FilterExpression": headerKeys,
            "ExpressionAttributeNames": {
                "#sessionID": 'sessionID',
                '#timestamp': 'timestamp'
            },            
            "ExpressionAttributeValues": values
        };

        db.scan(params, function(itemFound){
            var i = 0;
            itemFound.forEach(function(e) {
                B2.util.log.silly("Injected Context by Tags[item=" + JSON.stringify(e) + "]", { line: __line });
                context.push(e);
                i++;
            }, this);

            resolve(context);
        });
    });    
}

/**
 * Function used to get last x context items based on SessionID
 */
B2.CTX.DYNAMO.prototype.getContextByNumber = function (sessionID, numberOfIterations) {
    var _self = this;
    return new Promise(function(resolve, reject) {
        resolve(_self.getContextBySessionID(sessionID, numberOfIterations));
    });
}

B2.CTX.DYNAMO.prototype.createContext = function (timestamp, sessionID, entities, payload, bestmatch, response, intent, environmentVars, callback) {
    var persistContext = true;
    var _id;
    var _tags;

    if (bestmatch) {
        if (bestmatch.knowledge._source.persistContext !== undefined)
            persistContext = bestmatch.knowledge._source.persistContext;

        _tags = bestmatch.knowledge._source.tags;
        _id = bestmatch.knowledge._id;
    }

    if (B2.configs.persistContext !== undefined)
        persistContext = B2.configs.persistContext;

    if (db == undefined) {
        db = B2.getModule("AWS", core).dynamo;
    }
    
    var table = B2.configs.contextTable;

    if (table === undefined)
        persistContext = false;

    try {
        payload = JSON.parse(payload);
    } catch (e){}

    // Prevent Recursive Calls
    if (payload !== undefined)
        payload.context = undefined;

    var item = {}
    item.uid             = sessionID.toString() + "-" + timestamp;
    item.sessionID       = sessionID.toString();
    item.timestamp       = timestamp;
    item.entities        = entities;
    item.payload         = payload;
    item.intent          = intent;
    item.id              = _id;
    item.knowledgeTags   = _tags;
    item.enrichmentTags  = response.tags;
    item.environmentVars = environmentVars;    

    if (!persistContext) {
        B2.util.log.info("Context Disabled [content=" + JSON.stringify(item) + "]", { line: __line });
        if (callback) {
            callback();
        }        
        return;
    }

    try {
        db.create(table, item, function(){
            B2.util.log.debug("Context Saved to [table=" + table + ", content=" + JSON.stringify(item) + "]", { line: __line });

            if (callback) {
                callback();
            }       
        });
    } catch (e){
        B2.util.log.error("Error Saving Context: " + e, { line: __line });
        if (callback) {
            callback();
        }        
    }
}

B2.CTX.DYNAMO.prototype.injectContext = function (sessionID, bestMatch) {
    var _self = this;
    B2.util.log.debug("Injecting Context [sessionID=" + sessionID + ", bestMatch=" + JSON.stringify(bestMatch) + "]", { line: __line });
    
    var ctx = [];

    return new Promise(function(resolve, reject) {
        if (core.metrics.event.testMode)
            resolve(ctx);

        // Identify Ctx Strategy
        var ctxStrategy;

        var contextDefinitions = bestMatch._source.contextDefinitions;
        if (contextDefinitions === undefined) {
            B2.util.log.debug("Injecting Context [NO CONTEXT DEFINED]", { line: __line });
            resolve(ctx);
        } else {
            ctxStrategy = contextDefinitions.strategy;
        }
        
        if (ctxStrategy === undefined) {
            B2.util.log.debug("Injecting Context [NO STRATEGY DEFINED]", { line: __line });
            resolve(ctx);
        }
        
        if (ctxStrategy == "SessionID") {
            _self.getContextBySessionID(sessionID)
            .then(function(context){
                ctx = context;
                core.metrics.context = context;
                resolve(ctx);
            });
        } else if (ctxStrategy == "LastNumberOfIterations") {
            var contextSize = contextDefinitions.size;
            contextSize = (contextSize === undefined ? 1 : contextSize);

            _self.getContextByNumber(sessionID, contextSize)
            .then(function(context){
                ctx = context;
                core.metrics.context = context;
                resolve(ctx);
            });
        } else if (ctxStrategy == "Tags") {
            var tags = bestMatch._source.tags;
            if (tags === undefined) {
                B2.util.log.debug("Injecting Context [NO TAGS DEFINED]", { line: __line });
                resolve(ctx);
            }

            _self.getContextByTags(sessionID, tags)
            .then(function(context){
                ctx = context;
                core.metrics.context = context;
                resolve(ctx);
            });
        }
    });       
}

/**
 * Function used to get the conversation logs based on SessionID
 */
B2.CTX.DYNAMO.prototype.getConversationBySessionID = function (sessionID, limit) {
    var _self = this;
    var table = B2.configs.conversationLogsTable;
    sessionID = sessionID.toString();
    var ctxTTLLimit = 48;

    if (db == undefined) {
        db = B2.getModule("AWS", core).dynamo;
    }

    var contextSize = 1;

    if (B2.configs.ctxTTLLimit !== undefined) {
        ctxTTLLimit = B2.configs.ctxTTLLimit;
    }

    if (limit !== undefined) {
        contextSize = limit;
    }

    contextSize = (contextSize > 10 ? 1 : contextSize);

    return new Promise(function(resolve, reject) {
        var context = [];

        if (core.metrics.event.testMode)
            resolve(context);

        if (table == undefined) {
            resolve(context);
        }

        var startScanDate = moment();
        startScanDate.subtract(ctxTTLLimit,'hour');
        var millis = startScanDate.toDate().getTime();

        var params = {
            "TableName": table,
            "ConsistentRead": false,
            "IndexName": "sessionID-timestamp-index",
            "Limit": contextSize,
            "ScanIndexForward": false, 
            "KeyConditionExpression": "sessionID = :val AND #timestamp >= :timestamp",
            "ExpressionAttributeNames": {
                '#timestamp': 'timestamp'
            },            
            "ExpressionAttributeValues": {
                ":val": sessionID,
                ':timestamp': millis
            }
        };

        db.query(params, function(itemFound){
            var i = 0;
            itemFound.forEach(function(e) {
                context.push(e);
                i++;
            }, this);

            resolve(context);
        });
    });
}

module.exports = B2.CTX;