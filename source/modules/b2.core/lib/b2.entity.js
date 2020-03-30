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
var util    = require('util');
var natural = require('natural');

var Emitter = require('events').EventEmitter;
var db;
var instance;

B2.ENTITY = function () {Emitter.call(this);}
util.inherits(B2.ENTITY, Emitter)
var core;

B2.ENTITY.getInstance = function (coreInstance) {
    core = coreInstance;
    instance = new B2.ENTITY();
    db = B2.getModule("AWS", core).dynamo;

    return instance;
};

/**
 * Entity Resolver
 */
B2.ENTITY.prototype.entityResolver = function (intent, callback) {
    var _self = this;
    var result    = {};
    var entityResolverEnabled = true;

    if (B2.configs.entityResolverEnabled != undefined)
        entityResolverEnabled = B2.configs.entityResolverEnabled;

    B2.util.log.debug("Entity Resolver Enabled ? [enabled=" + entityResolverEnabled + "]", { line: __line });

    if (entityResolverEnabled == false) {
        if (callback) {
            callback(result);
            return;
        }     
    }

    var tokenizer = new natural.RegexpTokenizer({pattern: / /});
    var NGrams    = natural.NGrams;
    NGrams.setTokenizer(tokenizer);
    var bigrams   = NGrams.bigrams(intent);
    var trigrams  = NGrams.trigrams(intent);
    var query     = [];

    B2.util.log.debug("NGrams Bigrams: " + bigrams, { line: __line });
    B2.util.log.debug("NGrams Trigrams: " + trigrams, { line: __line });

    tokenizer.tokenize(intent).forEach(function(p){
        if (p.length >= 3) {
            query.push(p);
        }
    });

    bigrams.forEach(function(p){
        query.push(p.join(" "));
    });

    trigrams.forEach(function(p){
        query.push(p.join(" "));
    });

    _self.entityResolverDynamoImpl(query, callback);
};

B2.ENTITY.prototype.entityResolverDynamoImplScan = function (query, callback) {
    var table = B2.configs.entitiesTable;
    var result = [];
    var values = {};
    var headerKeys = "";
    var i = 1;

    query.forEach(function(item){
        values[":val" + i] = item
        headerKeys = headerKeys + "#ev = :val" + i + " OR "
        i++;
    });

    headerKeys = headerKeys.substring(0, headerKeys.length - 3);
      var params = {
        TableName : table,
        // IndexName: "entity-value-index",
        FilterExpression: headerKeys,
        ExpressionAttributeNames: {
            '#ev': 'entity-value'
        },
        ExpressionAttributeValues: values
      };

      // No items to scan in dynamo
      if (query.length == 0) {
        if (callback) {
            callback(result);
            return;
        }
      }

      try {
        db.scan(params, function(itemFound){
            itemFound.forEach(function(entity) {
                var removable = true;                
                var ety = entity["entity-type"];
                var val = entity["entity-value"];
                var rkn = entity["related-knowledge"];
                var rem = entity["removable"];                
                
                if (rem !== undefined)
                    removable = rem;

                result.push({
                    "type": ety,
                    "value": val,
                    "knowledge": rkn,
                    "removable": removable
                });

                // result[ety] = {
                //     "value": val,
                //     "knowledge": rkn,
                //     "removable": removable
                // };
            });

            if (callback) {
                callback(result);
            }            
        });
      } catch (e) {
        B2.util.log.error("Error in Dynamo Query [" + e + "]", { line: __line });
        if (callback) {
            callback(result);
        } 
      }

};

/**
 * Query using index
 */
B2.ENTITY.prototype.entityResolverDynamoImpl = function (query, callback) {
    var table = B2.configs.entitiesTable;
    var result = [];

    // No items to scan in dynamo
    if (query.length == 0) {
        if (callback) {
            callback(result);
            return;
        }
    }

    var arrQuery = [];

    query.forEach(function(item){
        var p = new Promise(function(resolve, reject) {
                var params = {
                    TableName : table,
                    IndexName: "entity-value-index",
                    KeyConditionExpression: "#ev = :ev",
                    ExpressionAttributeNames: {
                        '#ev': 'entity-value'
                    },
                    ExpressionAttributeValues: {
                        ':ev': item
                    }
                };
        
                try {
                    db.query(params, function(itemFound){
                        B2.util.log.debug("itemFound [" + JSON.stringify(itemFound) + "]", { line: __line });

                        itemFound.forEach(function(entity) {
                            var removable = true;                
                            var ety = entity["entity-type"];
                            var val = entity["entity-value"];
                            var rkn = entity["related-knowledge"];
                            var rem = entity["removable"];
                            var len = entity["entity-value"].length;
                            
                            if (rem !== undefined)
                                removable = rem;
            
                            result.push({
                                "type": ety,
                                "value": val,
                                "knowledge": rkn,
                                "len": len,
                                "removable": removable
                            });
                        });    
                        resolve();
                    });
                } catch (e) {
                    B2.util.log.error("Error in Dynamo Query [" + e + "]", { line: __line });
                    resolve();
                }    
            });
        arrQuery.push(p);
    });

    Promise.all(arrQuery).then(function(values){   
        if (callback) {
            callback(result);
        }         
    });
};

B2.ENTITY.prototype.persistEntities = function (payload, bestMatch, callback) {
    var db = B2.getModule("AWS", core).dynamo;
    var table = B2.configs.entitiesTable;
    var saveList = [];
    var persistEntities = false;

    if (B2.configs.persistEntities != undefined)
        persistEntities = B2.configs.persistEntities;

    B2.util.log.debug("persistEntities Status [" + persistEntities + "]", { line: __line });

    if (!persistEntities) {
        if (callback) {callback();return;} else {return;}
    }

    if (payload === undefined) {
        if (callback) {callback();return;} else {return;}
    }

    try {
        payload  = JSON.stringify(payload);
        payload  = JSON.parse(payload);
    } catch(e){
        if (callback) {callback();return;} else {return;}
    }
    
    var keys = Object.keys(payload);
    
    keys.forEach(function(p){
        var chave = p;
        var item  = payload[p];

        if (item.length < 3) {
            return;
        }

        // Discard internal keys
        if ((chave === "lang") || (chave === "about") || (chave === "step") || (chave === "context") || (chave === "_entities") || (chave === "_tags"))  
            return;

        if (B2.CORE.getObjType(item) == B2.objTypes.OBJECT) {
            Object.keys(item).forEach(function(asyncPaylod){
                var c = asyncPaylod;
                var v = item[asyncPaylod];

                if (v.response !== undefined) {
                    saveList.push({"item": v.response, "chave": asyncPaylod});                        
                }
            });
        }

        // Check if entity is protected. If Yes, don't save ;)
        if (B2.PRODUCERS.protectedEntities !== undefined) {
            if (B2.PRODUCERS.protectedEntities.indexOf(chave) !== -1) {
                B2.util.log.silly("Protected Entity Detected ==> DON'T SAVED [key=" + chave + ", value=" + item + "]", { line: __line });
                return;
            }
        }

        saveList.push({"item": item, "chave": chave});
    });

    B2.util.log.debug("persistEntities saveList [" + saveList + "]", { line: __line });

    saveList.forEach(function(isl){
        var item  = isl.item;
        var chave = isl.chave;

        if ((chave === undefined) || (item === undefined)) {
            callback(); return;
        }            

        if (typeof item === 'string' || item instanceof String) {
            B2.util.log.debug("Saving Entity [key=" + chave + ", value=" + item + "]", { line: __line });

            var uid = B2.generateHashCode(chave.toLowerCase() + item.toLowerCase()).toString();
            var _id   = bestMatch._id;

            var params = {
                "TableName": table,
                "Key": {
                    "uid": uid
                },
                "UpdateExpression" : "SET #entitytype=:entitytype, #entityvalue=:entityvalue, #lastUpdated=:lastUpdated, #removable=:removable, #relatedknowledge = list_append(if_not_exists(#relatedknowledge, :empty_list), :relatedknowledge)",
                "ConditionExpression": "not contains (#relatedknowledge, :knowledgeIdStr)",
                "ExpressionAttributeNames" : {
                    "#entitytype": "entity-type",
                    "#entityvalue": "entity-value",
                    "#lastUpdated": "lastUpdated",
                    "#relatedknowledge" : "related-knowledge",
                    "#removable" : "removable"
                },
                "ExpressionAttributeValues" : {
                    ":entitytype": chave.toLowerCase(),
                    ":entityvalue": item.toLowerCase(),
                    ":lastUpdated": new Date().getTime(),
                    ":knowledgeIdStr": _id,
                    ":relatedknowledge": [_id], 
                    ":empty_list":[],
                    ":removable": true
                }
            }

            db.createWithParams(params, function(){
                B2.util.log.debug("Entity Saved to [table=" + table + ", key=" + chave + ", value=" + item + "]", { line: __line });

                if (callback) {
                    callback();
                }       
            });
        }   
    });

}

module.exports = B2.ENTITY;