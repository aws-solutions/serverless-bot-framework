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

var B2      = require('../../index.js');
var FuzzySearch   = require('fuzzysearch-js');
var levenshteinFS = require('fuzzysearch-js/js/modules/LevenshteinFS');
var indexOfFS     = require('fuzzysearch-js/js/modules/IndexOfFS');
var wordCountFS   = require('fuzzysearch-js/js/modules/WordCountFS');
var _             = require('underscore');
var percentile    = require("stats-percentile");
var natural       = require('natural');

var metrics;
var core;

var removePontuaction = function (str) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }
    
    return str.replace(/[&\/\\#,+\(\)$~%\.!^'"\;:*?\[\]<>]/g, '');
}

B2.BRAIN.prototype.amcClassificationsImpl = function (intentArray, callback) {
    var _self = this;    

    var maxScore = 0;
    var maxkID   = undefined;
    var maxEntities = 0;

    var bagMaxScore = 0;
    var bagMaxkID   = [];
    var replacedValuesByFuzzy = {};
    var amcModel;
    var modelAVG = 0;
    var modelIntentAVG = 0;

    var wordModel;
    var fuzzyDB = [];
    var fuzzySearch;
    var totalItemsClassified = 0;
    var statistics;

    var brainFile = "http://s3.amazonaws.com/" + B2.configs.bucketName + "/brain-amcClassificationsImpl.pgk";
    B2.util.log.debug("Classifications Trained Model [" + brainFile + "]", { line: __line });

    function createWordCloud (paramArr) {
        var finalArr = [];

        paramArr.forEach(function(intent){
            _self.tokenizer(intent).forEach(function(w){
                if (!_.contains(finalArr, w)) {
                    finalArr.push(w);
                }
            });
        });

        return finalArr;
    }

    function getBestKnowledgeByBag (intentWordCloud, knowledge, wordModel, knowledgeWordCloud) {
        var score  = 0;        

        var intersection = _.intersection(intentWordCloud, knowledgeWordCloud);
        var difference   = _.difference(intentWordCloud, knowledgeWordCloud);

        // Increase the Score of matched items
        intersection.forEach(function(w){
            totalItemsClassified = totalItemsClassified + 1;
            var model = wordModel[w];
            var l     = model.l;
            var p     = model.p;
            var d     = model.d;
            var i     = model.i;
            var e     = false;

            if (model.entity)
                e = model.entity;

            var reld  = model.reld;
            var relp  = model.relp;

            var s = reld + relp;

            if (e) {
                s = 200;
            }

            if (model.relscore >= statistics.percentile.relmin) {
                score = score + s;
                B2.util.log.silly("      bag Classifications Details by String [e=" + e + ", w=" + w + ", l=" + l + ", p=" + p + ", d=" + d + ", i=" + i + ", scoreIncrement=" + s + ", score=" + score + "]", { line: __line });
            }
        });

        return score;
    }

    var content = B2.BRAIN.content;
    var startAmcClassifier = new Date().getTime();

    var brain = content;            

    amcModel = brain;

    var tfidf                = {};
    var bagDetailedScores    = [];
    var linearDetailedScores = [];

    wordModel        = brain.statistics.idx;
    statistics       = brain.statistics;

    var minPercentil = statistics.percentile.relmin;

    var idList             = [];
    var idListLowPercentil = [];

    var intentWordCloud = createWordCloud(intentArray);

    intentWordCloud.forEach(function(w){
        // Return rel of word
        if (wordModel[w]) {
            var rel = wordModel[w].rel;
            
            if (wordModel[w].relscore >= minPercentil) {
                rel.forEach(function(id){
                    if (!_.contains(idList, id)) {
                        idList.push(id);
                    }                
                });
            } 
        }
    });

    var knowledgeBase = brain.knowledge;

    if (idList.length == 0) {
        idList = idListLowPercentil;
    }

    idList.forEach(function(kID){
        B2.util.log.silly("Working with  [clazz=" + kID + ", intentWordCloud=" + intentWordCloud + "]", { line: __line });
        var knowledge = knowledgeBase[kID];
        
        var knowledgeWordCloud = knowledge._wordCloud ? knowledge._wordCloud : createWordCloud(knowledge._intents);

        B2.util.log.silly("Working with  [clazz=" + kID + ", knowledgeWordCloud=" + knowledgeWordCloud + "]", { line: __line });
        
        var bagScore    = getBestKnowledgeByBag(intentWordCloud, knowledge, wordModel, knowledgeWordCloud);
        var rawBagScore = bagScore;

        bagScore = parseFloat(bagScore);

        bagDetailedScores.push({label: kID, value: bagScore});

        B2.util.log.silly("Bag Classifications [clazz=" + kID + ", intentWordCloud=" + intentWordCloud + ", rawBagScore=" + rawBagScore + ", score=" + bagScore + "]", { line: __line });
    });

    var topBagDetailedScores = _.sortBy(bagDetailedScores, 'value');

    var groupedScores = _.groupBy(topBagDetailedScores, 'value');
    var arrGrouped    = [];

    Object.keys(groupedScores).forEach(element => {            
        arrGrouped.push(parseFloat(element));
    });

    arrGrouped = _.sortBy(arrGrouped);
    arrGrouped = _.last(arrGrouped, 5);
    
    topBagDetailedScores = [];

    if (arrGrouped)
        arrGrouped.forEach(key => {
            groupedScores[key].forEach(element => {
                topBagDetailedScores.push(element);
            });
        });

    if (topBagDetailedScores)
        topBagDetailedScores.forEach(function(scoreItem){
            bagMaxkID.push(scoreItem.label);
        });

    var totalAmcClassifier = new Date().getTime() - startAmcClassifier;
    var startAmdClassifier = new Date().getTime();
    var totalAmdItemsClassified = 0;

    bagMaxkID.forEach(function(kID){
        var knowledge = knowledgeBase[kID];

        var tmp = [];

        knowledge._intents.forEach(function(i){
            i = removePontuaction(i);
            i = B2.PARSERS.removeAccent(i);
            i = i.toLowerCase();

            if (!_.contains(tmp, i)) {
                tmp.push(i);
            };
        });

        tmp.forEach(function(i){
            intentArray.forEach(function(intent){
                totalAmdItemsClassified = totalAmdItemsClassified + 1;

                var iWordCloud      = _self.tokenizer(i);
                var intentWordCloud = _self.tokenizer(intent);

                var intersectionLength     = _.intersection(iWordCloud, intentWordCloud).length;
                var percIntersectionLength = (intersectionLength / intentWordCloud.length);
                                    
                if (intersectionLength > 0) {
                    if (percIntersectionLength > 0.3) {
                        var score = _self.auntMaricotaDistance(i, intent, wordModel);

                        linearDetailedScores.push({clazz: kID, intent: i, event: intent, score: score.value, totalEntities: score.totalEntities, diff: score.diff, intersectionSize: score.intersectionSize, details: score});
                        B2.util.log.silly("AMD Classifications [clazz=" + kID + ", intent=" + i + ", event=" + intent + ", score=" + score.value + ", totalEntities=" + score.totalEntities + "]", { line: __line });

                        if (score.value >= maxScore) {
                            if (score.value == 1) {
                                maxEntities = score.totalEntities;
                                maxScore    = score.value;
                                maxkID      = kID;
                            } else {
                                if (score.totalEntities >= maxEntities) {
                                    maxEntities = score.totalEntities;
                                    maxScore    = score.value;
                                    maxkID      = kID;
                                }
                            }
                        }                  
                    } else {
                        B2.util.log.silly("AMD Classifications [clazz=" + kID + ", intent=" + i + ", event=" + intent + ", percIntersectionLength=" + percIntersectionLength + "]", { line: __line });
                    }
                }
            });
        });
    });
    
    var groupedAMDs = _.groupBy(linearDetailedScores, 'intersectionSize');
    var linearScores = [];

    Object.keys(groupedAMDs).forEach(key => {
        var maxDiffArr = groupedAMDs[key];
        
        var maxScoreItem = _.max(maxDiffArr, function(mea){ return mea.score; });
        linearScores.push({intersection: key,label: maxScoreItem.clazz, value: maxScoreItem.score});
    });
    
    linearScores = _.sortBy(linearScores, 'intersection');

    linearScores = _.chain(linearScores).reverse().value();
    
    var totalAmdClassifier = new Date().getTime() - startAmdClassifier;

    var scoring = {};

    var rf = {label: maxkID, value: maxScore};
    var nl = {label: bagMaxkID, value: bagMaxScore};

    B2.util.log.debug("AMC Classification Performance     [totalTime=" + totalAmcClassifier + ", items=" + totalItemsClassified + "]", { line: __line });
    B2.util.log.debug("AMD Classification Performance     [totalTime=" + totalAmdClassifier + ", items=" + totalAmdItemsClassified + "]", { line: __line });
    B2.util.log.info( "Classifications Results Non Linear [" + JSON.stringify(topBagDetailedScores) + "]", { line: __line });
    B2.util.log.info( "Classifications Results            [" + JSON.stringify(linearScores) + "]", { line: __line });
    
    var retorno = [];
    scoring.linear = linearScores;
    scoring.non_linear = topBagDetailedScores;

    linearDetailedScores = _.sortBy(linearDetailedScores, 'score');

    if ((metrics) && (metrics.event) && metrics.event.dumpDetailedAMC) {
        scoring.bagDetailed = bagDetailedScores;
        scoring.linearDetailed = linearDetailedScores;    
    }

    retorno.push(scoring);

    if (callback) {
        callback(retorno);
        return;
    }

    return retorno;
}

module.exports = function(coreInstance){
    metrics = coreInstance.metrics;
    core = coreInstance;
}