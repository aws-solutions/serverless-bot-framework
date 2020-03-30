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
var AWS     = require('aws-sdk');
var Zip     = require("adm-zip");
var _       = require('underscore');

var multilabel = undefined;
var actionClassifier = undefined;
var intentClassifier = undefined;
var serialize = undefined;

B2.BRAIN = function () {Emitter.call(this);}
util.inherits(B2.BRAIN, Emitter)

var kb    = undefined;
var brain = undefined;

B2.BRAIN.content = undefined;
B2.BRAIN.kbm = undefined;
B2.BRAIN.federation = undefined;
B2.BRAIN.routeDefinitions = undefined;
B2.BRAIN.statistics = undefined;

var instance;
var core;

B2.BRAIN.getInstance = function (coreInstance) {    
    core = coreInstance;
    instance = new B2.BRAIN();
    
    require("./engines/b2.amc.js")(core);
    require("./engines/b2.amd.js");    

    return instance;
};

B2.BRAIN.prototype.loadKnowledge = function (callback) {
    var _self = this;

    var classificationEngine = B2.configs.engine;
    var knowledgeFile = "brain-" + classificationEngine + ".pgk";
    
    var kbFile = "http://s3.amazonaws.com/" + B2.configs.bucketName + "/" + knowledgeFile;    

    B2.util.log.debug("Knowledge File [" + kbFile + "]", { line: __line });

    if (process.env.forceCacheUpdate != undefined) {
      if (process.env.forceCacheUpdate == "true") {        
        B2.BRAIN.kbm = undefined;
      }
    }

    if (B2.BRAIN.kbm != undefined) {
        if (callback) {
            callback();
            return;
        }
    }

    B2.getRemoteFile(kbFile, function(content){
        var buf = new Buffer.from(content);

        var AdmZip = require('adm-zip');
        var zip = new AdmZip(buf);
        var zipEntries = zip.getEntries();
        content = zip.readAsText(zipEntries[0]);

        core.metrics.knowledgeCacheHit = B2.knowledgeCacheHit;
        try {
            content = JSON.parse(content);
            B2.BRAIN.content = content;
        } catch (ex) {B2.util.log.error(ex, { line: __line }); return;}
        
        if (content.statistics != undefined) {
            B2.BRAIN.statistics = content.statistics;
        }

        if (content.source != undefined) {
            content = content.source;
        }

        kb = content;

        // Load Stop Words
        if (kb.stopWords != undefined) {
            B2.getModule("PARSERS", core, function(){
                B2.PARSERS.library.stopWords = [];

                B2.PARSERS.library.stopWords = kb.stopWords;
            });
        }

        // Router
        if (kb.routeDefinitions !== undefined) {
            B2.BRAIN.routeDefinitions = kb.routeDefinitions;
        }        

        // Router
        if (kb.federation !== undefined) {
            B2.BRAIN.federation = kb.federation;
        }        
        
        // Load Protected Entities
        if (kb.protectedEntities != undefined) {
            B2.getModule("PRODUCERS", core, function(){
                B2.PRODUCERS.protectedEntities = [];

                B2.PRODUCERS.protectedEntities = kb.protectedEntities;
            });
        }        
        
        // Load Sentiment DB
        if (kb.analysers != undefined) {
            B2.getModule("ENRICHMENT", core, function(){
                B2.ENRICHMENT.sentimentDB       = {};
                B2.ENRICHMENT.negativeWords     = [];
                B2.ENRICHMENT.qualitativeWords  = [];
                B2.ENRICHMENT.quantitativeWords = [];
                B2.ENRICHMENT.temporalWords     = [];

                if (kb.analysers.sentiment != undefined)
                    B2.ENRICHMENT.sentimentDB = kb.analysers.sentiment;
                
                if (kb.analysers.negativeWords != undefined)
                    B2.ENRICHMENT.negativeWords = kb.analysers.negativeWords;

                if (kb.analysers.positiveWords != undefined)
                    B2.ENRICHMENT.positiveWords = kb.analysers.positiveWords;

                if (kb.analysers.qualitativeWords != undefined)
                    B2.ENRICHMENT.qualitativeWords = kb.analysers.qualitativeWords;

                if (kb.analysers.quantitativeWords != undefined)
                    B2.ENRICHMENT.quantitativeWords = kb.analysers.quantitativeWords;

                if (kb.analysers.temporalWords != undefined)
                    B2.ENRICHMENT.temporalWords = kb.analysers.temporalWords;

                if (kb.analysers.synonym != undefined) {
                    var base = kb.analysers.synonym;                    
                    Object.keys(base).forEach(function(key){
                        base[key].forEach(function(v){
                            v = v.toLowerCase();
                            B2.PARSERS.library.synonym[v] = key.toLowerCase();
                        });
                    });
                }   
            });

            B2.getModule("TEMPORAL", core, function(){
                if (kb.analysers.temporal != undefined) {
                    B2.TEMPORAL.library = {};
                    B2.TEMPORAL.library = kb.analysers.temporal;
                }                    
            });
        }
        
        if (kb.i18n != undefined) {
            B2.i18n = kb.i18n;
        }

        B2.util.log.debug("Knowledge Infos [name=" + kb.brainName + ", version=" + kb.version + ", lastUpdated=" + kb.lastUpdated + "]", { line: __line });

        var hits  = kb.knowledge;
        B2.BRAIN.kbm = {}
        
        B2.getModule("PARSERS", core, function(){
            B2.PARSERS.library.fuzzyDB = [];
        });

        // Add all the index items into an array
        hits.forEach(function(index){
            var _id   = index._id;
            B2.BRAIN.kbm[_id]  = index;

            _self.createFuzzyDB(index._intents);     

            // Create WordCount AVG
            var totalWordCounter = 0;
            var totalIntents = 0;

            index._intents.forEach(function(i){
                totalIntents = totalIntents + 1;
                var t = _self.tokenizer(i);
                totalWordCounter = totalWordCounter + t.length;
            });     
            
            B2.BRAIN.avgWordCount = totalWordCounter / totalIntents;
        });

        if (callback) {
            callback();
        }   
    });
};

/**
 * This method return the knowledge related to classifications results.
 */
B2.BRAIN.prototype.getKnowledge = function (intent, callback) {
    var _self = this;

    _self.loadKnowledge(function(){
        _self.getClassifications(intent, function(c){
            var knowledge   = {};
            var limitResult = 1;
            
            var pos = 0;
            if (c[0].linear) {
                c[0].linear.forEach(linearScore => {
                    knowledge[pos] = {}

                    knowledge[pos].classifier = linearScore;

                    knowledge[pos].knowledge  = B2.BRAIN.kbm[linearScore.label]._id;
                    knowledge[pos].maricotaDistance    = 0;

                    if (B2.BRAIN.kbm[linearScore.label] !== undefined) {
                        B2.BRAIN.kbm[linearScore.label]._intents.forEach(function(iter){
                            knowledge[pos].maricotaDistance = linearScore.value;
                        });
                    }                    
                    pos = pos + 1;
                });
            }

            if (callback) {
                callback(knowledge);
            }        
        });
    });
};

B2.BRAIN.tokenizer = function (intent, callback) {
    var _self = this;
    var arr = [];
    var tokenizer = new natural.RegexpTokenizer({pattern: / /});

    tokenizer.tokenize(intent).forEach(function(p){
        arr.push(p);    
    });

    if (callback) {
        callback(arr);
    } else {
        return arr;
    }
};

B2.BRAIN.prototype.tokenizer = function (intent, callback) {
    return B2.BRAIN.tokenizer(intent, callback);
};

B2.BRAIN.returnNGrams = function (intent, numberOfgrams, callback) {
    var tokenizer = new natural.RegexpTokenizer({pattern: / /});
    var NGrams    = natural.NGrams;
    NGrams.setTokenizer(tokenizer);
    
    var grams = NGrams.ngrams(intent, numberOfgrams);

    if (callback) {
        callback(grams);
    } else {
        return grams;
    }   
};

B2.BRAIN.prototype.createFuzzyDB = function (intents) {
    var _self = this;

    intents.forEach(function(e){
        e = e.toLowerCase();
        var tokenized = _self.tokenizer(e);

        tokenized.forEach(function(w){
            if (B2.PARSERS.library.fuzzyDB.indexOf(w) == -1)
                B2.PARSERS.library.fuzzyDB.push(w);
        });
    });
};

/**
 * This method return the first x classifications for the intent
 * Engine Types: amcClassificationsImpl
 */
B2.BRAIN.prototype.getClassifications = function (intentArray, callback) {
    var _self = this;
    var classificationEngine = B2.configs.engine;
    B2.util.log.info("Classifications Using Engine [engine=" + classificationEngine + "]", { line: __line });

    var intentArrayClean = [];

    intentArray.forEach(function(intent){
        intent = intent.toLowerCase();
        
        var parserStack = ['removePontuaction', 'removeAccent'];
        
        if (B2.configs.parserStack !== undefined) {
            parserStack = B2.configs.parserStack;
        }
    
        var parser = B2.getModule("PARSERS", core);
    
        if (parserStack.indexOf("removePontuaction") > -1) {
            intent = parser.runParser("removePontuaction", intent);
        }                        
        
        if (parserStack.indexOf("removeAccent") > -1) {
            intent = parser.runParser("removeAccent", intent);
        }

        B2.util.log.debug("Working with intentArray [intent=" + intent + "]", { line: __line });

        intentArrayClean.push(intent);
    });

    eval("_self." + classificationEngine + "(intentArrayClean, callback)");
};

B2.BRAIN.prototype.getBestMatch = function (knowledge, callback) {
    var nif;
    var auntMaricotaDistanceConfidence = 0.7;
    var amd;
    
    if (B2.configs.auntMaricotaDistanceConfidence != undefined) {
        auntMaricotaDistanceConfidence = B2.configs.auntMaricotaDistanceConfidence;
    }

    var bestMatch = undefined;
    var keys = Object.keys(knowledge);
    var totalKnowledge = keys.length;

    B2.util.log.debug("BestMatch Total Knowledge To Analyze [" + totalKnowledge + "]", { line: __line });
    
    // Analyse Classifier Score
    if (knowledge[0] === undefined) {
        B2.util.log.error("BestMatch Comparing SVM Score Result [No Confidente Achieved]", { line: __line });
        core.metrics.desiredMatch = {};
        core.metrics.desiredMatch.amd = amd;
        core.metrics.desiredMatch.result = "NIF";
        core.metrics.desiredMatch.desiredKnowledgeID = core.metrics.event.desiredKnowledgeID;        
        if (callback) {
            callback(bestMatch);
            return;
        }
    }

    Object.keys(knowledge).forEach(k => {
        var item0 = knowledge[k].classifier.value;
        var linearScore    = knowledge[k].classifier.linear;
        var nonLinearScore = knowledge[k].classifier.non_linear;
        
        if (bestMatch == undefined) {
            amd   = knowledge[k].maricotaDistance;            
            if (nonLinearScore !== undefined) {
                // if (nonLinearScore.length == 1) {            
                if (_.last(nonLinearScore, 1)[0].label == linearScore.label) {
                    if (amd >= (auntMaricotaDistanceConfidence / 2)) {
                        bestMatch = knowledge[k];
                        B2.util.log.debug("BestMatch Rule [non_linear label == linear label] Using [" + (auntMaricotaDistanceConfidence / 2) + "] instead of [" + auntMaricotaDistanceConfidence + "] confidence", { line: __line });
                    }
                } else if (_.last(nonLinearScore, 2)[0].label == linearScore.label) {
                    if (amd >= (auntMaricotaDistanceConfidence / 1.8)) {
                        bestMatch = knowledge[k];
                        B2.util.log.debug("BestMatch Rule [non_linear label == linear label] Using [" + (auntMaricotaDistanceConfidence / 1.8) + "] instead of [" + auntMaricotaDistanceConfidence + "] confidence", { line: __line });
                    }
                } else if (_.last(nonLinearScore, 3)[0].label == linearScore.label) {
                    if (amd >= (auntMaricotaDistanceConfidence / 1.6)) {
                        bestMatch = knowledge[k];
                        B2.util.log.debug("BestMatch Rule [non_linear label == linear label] Using [" + (auntMaricotaDistanceConfidence / 1.6) + "] instead of [" + auntMaricotaDistanceConfidence + "] confidence", { line: __line });
                    }
                } else if (_.last(nonLinearScore, 4)[0].label == linearScore.label) {
                    if (amd >= (auntMaricotaDistanceConfidence / 1.4)) {
                        bestMatch = knowledge[k];
                        B2.util.log.debug("BestMatch Rule [non_linear label == linear label] Using [" + (auntMaricotaDistanceConfidence / 1.4) + "] instead of [" + auntMaricotaDistanceConfidence + "] confidence", { line: __line });
                    }
                } else if (_.last(nonLinearScore, 5)[0].label == linearScore.label) {
                    if (amd >= (auntMaricotaDistanceConfidence / 1.2)) {
                        bestMatch = knowledge[k];
                        B2.util.log.debug("BestMatch Rule [non_linear label == linear label] Using [" + (auntMaricotaDistanceConfidence / 1.2) + "] instead of [" + auntMaricotaDistanceConfidence + "] confidence", { line: __line });
                    }
                }
                // }            
            }
        
            if (bestMatch == undefined) {
                if (amd >= auntMaricotaDistanceConfidence) {
                    bestMatch = knowledge[k];
                    B2.util.log.debug("BestMatch Rule [amd >= auntMaricotaDistanceConfidence] Using [" + (auntMaricotaDistanceConfidence) + "] of confidence", { line: __line });
                }
            }
        }
    });

    if (bestMatch == undefined) {
        nif = true;
        B2.util.log.error("BestMatch Comparing AMC/AMD Score Result [No Confidente Achieved]", { line: __line });
        core.metrics.desiredMatch = {};
        core.metrics.desiredMatch.amd = amd;
        core.metrics.desiredMatch.result = "NIF";
        core.metrics.desiredMatch.desiredKnowledgeID = core.metrics.event.desiredKnowledgeID;
    } else {
        nif = false;
        core.metrics.desiredMatch = {};
        core.metrics.desiredMatch.amd = amd;
        core.metrics.desiredMatch.bestMatchID = bestMatch.knowledge;
        
        if (core.metrics.event.desiredKnowledgeID) {
            core.metrics.desiredMatch.desiredKnowledgeID = core.metrics.event.desiredKnowledgeID;

            if (core.metrics.event.desiredKnowledgeID == bestMatch.knowledge) {
                core.metrics.desiredMatch.result = "HIT";
            } else {
                core.metrics.desiredMatch.result = "MISS";
            }
        }    
    }

    if (callback) {
        callback(bestMatch);
    }
};

B2.BRAIN.prototype.getKnowledgeByID = function (kID, callback) {
    var _self = this;
    
    _self.loadKnowledge(function(){
        var knowledge   = {};

        knowledge = {};
        knowledge.classifier = {}
        knowledge.classifier.linear = {}
        knowledge.classifier.linear.value = 1;
        knowledge.knowledge  = B2.BRAIN.kbm[kID];
        knowledge.maricotaDistance = 1;        
        
        if (callback) {
            callback(knowledge);
        }
    });
};

module.exports = B2.BRAIN;