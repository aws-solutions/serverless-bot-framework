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
var Emitter = require('events').EventEmitter;
var natural = require('natural');

B2.ENRICHMENT = function () {Emitter.call(this);}
util.inherits(B2.ENRICHMENT, Emitter)

B2.ENRICHMENT.addons      = {};
B2.ENRICHMENT.ext         = {};
B2.ENRICHMENT.sentimentDB = {};

B2.ENRICHMENT.negativeWords     = [];
B2.ENRICHMENT.positiveWords     = [];
B2.ENRICHMENT.qualitativeWords  = [];
B2.ENRICHMENT.quantitativeWords = [];
var core;

B2.ENRICHMENT.getInstance = function (coreInstance) {
    core = coreInstance;
    var instance = new B2.ENRICHMENT();

    // Register defaults
    instance.addons = {};
    instance.addons['sentiment']         = instance.sentiment;
    instance.addons['negativeWords']     = instance.negativeWords;
    instance.addons['positiveWords']     = instance.positiveWords;
    instance.addons['qualitativeWords']  = instance.qualitativeWords;
    instance.addons['quantitativeWords'] = instance.quantitativeWords;
    instance.addons['temporalWords']     = instance.temporalWords;
    
    // Get Custom dataEnrichment
    instance.ext = {};
    var keys = Object.keys(B2.dataEnrichment);
    keys.forEach(function(p){
        if (instance.addons[p]) {            
            instance.addons[p] = B2.dataEnrichment[p];
            B2.util.log.warn("DataEnrichment [" + p + "] WAS REPLACED!!", { line: __line });
        } else {
            instance.ext[p] = B2.dataEnrichment[p];
            B2.util.log.warn("DataEnrichment [" + p + "] ADDED TO THE STACK!!", { line: __line });
        }
    });

    return instance;
};

/**
 * Run Enrichment Stack
 */
B2.ENRICHMENT.prototype.runStack = function (stack, obj) {
    var _self  = this;
    var intent = obj;
    var tags   = [];

    stack.forEach(function(element){
        B2.util.log.debug("Enrichment Stack BEFORE [enrich=" + element + ", intent=" + intent + "]", { line: __line });

        var ret = undefined;
        try {
            if (typeof intent === 'string' || intent instanceof String) {
                ret = _self.addons[element](intent);
            }
        } catch (e) {
            B2.util.log.error("Error Running Enrichment [enrichment=" + element + ", error=" + e + "]", { line: __line });
        }

        if (ret != undefined) {
            if (typeof ret === 'string' || ret instanceof String) {
                tags.push(ret);
            } else {
                ret.forEach(function(t){
                    tags.push(t);
                });
            }            
        }

        B2.util.log.debug("Enrichment Stack AFTER [enrich=" + element + ", intent=" + intent + "]", { line: __line });
    });

    // RUN Additional dataEnrichment
    var keys = Object.keys(_self.ext);
    keys.forEach(function(element){
        B2.util.log.debug("Enrichment Stack Ext BEFORE [enrich=" + element + ", intent=" + intent + "]", { line: __line });

        var ret = undefined;
        try {
            if (typeof intent === 'string' || intent instanceof String) {
                ret = _self.ext[element](intent);
            }
        } catch (e) {
            B2.util.log.error("Error Running Enrichment [enrichment=" + element + ", error=" + e + "]", { line: __line });
        }

        B2.util.log.debug("Enrichment Stack Ext AFTER [enrich=" + element + ", intent=" + intent + "]", { line: __line });
    });

    return tags;
};

/**
 * Function used to extract sentiment using dynamic TAGS
 */
B2.ENRICHMENT.prototype.sentiment = function (intent, callback) {
    var _self = this;

    console.log(intent);

    var tag = [];

    var keys = Object.keys(B2.ENRICHMENT.sentimentDB);

    if (B2.ENRICHMENT.sentimentDB) {
        keys.forEach(function(key){
            if (B2.ENRICHMENT.sentimentDB[key]) {
                B2.ENRICHMENT.sentimentDB[key].forEach(function(element){
                    if(intent.indexOf(element) > -1) {
                        tag.push(key + ":" + element);
                    }
                });    
            }        
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

/**
 * Function used to extract negativeWords
 */
B2.ENRICHMENT.prototype.negativeWords = function (intent, callback) {
    var _self = this;

    var tag = undefined;

    if (B2.ENRICHMENT.negativeWords) {
        B2.ENRICHMENT.negativeWords.forEach(function(element){
            if(intent.indexOf(element) > -1) {
                tag = "NEGATIVE";
            }    
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

/**
 * Function used to extract positiveWords
 */
B2.ENRICHMENT.prototype.positiveWords = function (intent, callback) {
    var _self = this;

    var tag = undefined;

    if (B2.ENRICHMENT.positiveWords) {
        B2.ENRICHMENT.positiveWords.forEach(function(element){
            if(intent.indexOf(element) > -1) {
                tag = "POSITIVE";
            }    
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

/**
 * Function used to extract qualitativeWords
 */
B2.ENRICHMENT.prototype.qualitativeWords = function (intent, callback) {
    var _self = this;

    var tag = undefined;

    if (B2.ENRICHMENT.qualitativeWords) {
        B2.ENRICHMENT.qualitativeWords.forEach(function(element){
            if(intent.indexOf(element) > -1) {
                tag = "QUALITATIVE";
            }    
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

/**
 * Function used to extract quantitativeWords
 */
B2.ENRICHMENT.prototype.quantitativeWords = function (intent, callback) {
    var _self = this;

    var tag = undefined;

    if (B2.ENRICHMENT.quantitativeWords) {
        B2.ENRICHMENT.quantitativeWords.forEach(function(element){
            if(intent.indexOf(element) > -1) {
                tag = "QUANTITATIVE";
            }    
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

/**
 * Function used to extract temporalWords
 */
B2.ENRICHMENT.prototype.temporalWords = function (intent, callback) {
    var _self = this;

    var tag = undefined;

    if (B2.ENRICHMENT.temporalWords) {
        B2.ENRICHMENT.temporalWords.forEach(function(element){
            if(intent.indexOf(element) > -1) {
                tag = "TEMPORAL";
            }    
        });
    }

    if (callback) {callback(tag);} else {return tag;}   
};

module.exports = B2.ENRICHMENT;