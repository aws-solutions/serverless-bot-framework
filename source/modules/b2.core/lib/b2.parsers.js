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
var dateFormat = require('dateformat');
var FuzzySearch   = require('fuzzysearch-js');
var levenshteinFS = require('fuzzysearch-js/js/modules/LevenshteinFS');
var indexOfFS     = require('fuzzysearch-js/js/modules/IndexOfFS');
var wordCountFS   = require('fuzzysearch-js/js/modules/WordCountFS');

B2.PARSERS = function () {Emitter.call(this);}
util.inherits(B2.PARSERS, Emitter)

B2.PARSERS.defaultStack = ['replaceSynonym', 'removePontuaction', 'fuzzyReplacement', 'removeAccent', 'removeStopWords', 'temporal'];
B2.PARSERS.addons  = {};
B2.PARSERS.ext     = {};
B2.PARSERS.library = {};
B2.PARSERS.library.stopWords = [];
B2.PARSERS.library.fuzzyDB = [];
B2.PARSERS.library.synonym = {};

var instance ;
var core;
var brain;

B2.PARSERS.getInstance = function (coreInstance) {
    core  = coreInstance;
    brain = B2.getModule("BRAIN", core);

    instance = new B2.PARSERS();
    // Register defaults
    instance.addons = {};
    instance.addons['replaceSynonym']     = instance.replaceSynonym;    
    instance.addons['removeStopWords']    = instance.removeStopWords;
    instance.addons['removePontuaction']  = instance.removePontuaction;    
    instance.addons['removeAccent']       = instance.removeAccent;
    instance.addons['fuzzyReplacement']   = instance.fuzzyReplacement;
    instance.addons['temporal']           = instance.temporal;    

    // Get Custom Parsers
    instance.ext = {};
    var keys = Object.keys(B2.parsers);
    keys.forEach(function(p){
        if (instance.addons[p]) {            
            instance.addons[p] = B2.parsers[p];
            B2.util.log.warn("Parser [" + p + "] WAS REPLACED!!", { line: __line });
        } else {
            instance.ext[p] = B2.parsers[p];
            B2.util.log.warn("Parser [" + p + "] ADDED TO THE STACK!!", { line: __line });
        }
    });

    return instance;   
};

B2.PARSERS.prototype.runParser = function (parser, obj) {
    var _self = this;
    var ret = obj;

    try {
        ret = _self.addons[parser](obj)
    } catch (e) {
        B2.util.log.error("Error Running Parser [parser=" + parser + ", error=" + e + "]", { line: __line });
    }

    return ret;
};

B2.PARSERS.prototype.runParserStack = function (stack, obj) {
    var _self  = this;
    var intent = obj.toLowerCase();

    core.metrics.parsers = {}
    var promisseStack = [];

    stack.forEach(function(element){
        var p = new Promise(function(resolve, reject) {
            B2.util.log.debug("Parser Stack BEFORE [parser=" + element + ", intent=" + intent + "]", { line: __line });
            
            var startTime = new Date().getTime();
            
            try {
                intent = _self.addons[element](intent, resolve, reject);
            } catch (e) {
                B2.util.log.error("Error Running Parser [parser=" + element + ", error=" + e + "]", { line: __line });
            }
            
            var endTime = new Date().getTime();
            core.metrics.parsers[element] = {}
            core.metrics.parsers[element].totalTime = endTime - startTime;

            B2.util.log.debug("Parser Stack AFTER [parser=" + element + ", intent=" + intent + "]", { line: __line });
        });

        promisseStack.push(p);
    });

    var promisseAdditionalStack = [];

    // RUN Additional Parsers
    var keys = Object.keys(_self.ext);
    keys.forEach(function(element){
        var p = new Promise(function(resolve, reject) {
            B2.util.log.debug("Parser Stack Ext BEFORE [parser=" + element + ", intent=" + intent + "]", { line: __line });

            var startTime = new Date().getTime();

            try {
                intent = _self.ext[element](intent, resolve, reject);
            } catch (e) {
                B2.util.log.error("Error Running Parser [parser=" + element + ", error=" + e + "]", { line: __line });
            }
            
            var endTime = new Date().getTime();
            core.metrics.parsers[element] = {}
            core.metrics.parsers[element].totalTime = endTime - startTime;

            B2.util.log.info("Parser Stack Ext AFTER [parser=" + element + ", intent=" + intent + "]", { line: __line });
        });

        promisseAdditionalStack.push(p);
    });

    Promise.all(promisseStack).then(function(values){   
        Promise.all(promisseAdditionalStack).then(function(values){   
        });
    });    

    return intent;
};

B2.PARSERS.prototype.runTrainedParserStack = function(i) {
    var _self = this;
    var parserStack = ['removePontuaction', 'removeAccent'];
    
    if (B2.configs.parserStack !== undefined) {
        parserStack = B2.configs.parserStack;
    }

    if (parserStack.indexOf("removePontuaction") > -1) {
        i = _self.runParser("removePontuaction", i);
    }                        
    
    if (parserStack.indexOf("removeAccent") > -1) {
        i = _self.runParser("removeAccent", i);
    }    

    i = i.toLowerCase();

    return i;
}


B2.PARSERS.prototype.entityCleanUP = function (intent, entities, callback) {
    var result    = undefined;

    var keys = Object.keys(entities);
    keys.forEach(function(element){
        var val  = entities[element].value;
        var type = entities[element].type;
        
        if (intent.indexOf(val) > -1) {
            if ((entities[element].removable) || (entities[element].removable === "true")) {
                intent = intent.replace(val, "{" + type + "}");
                B2.util.log.debug("Parser entityCleanUP REMOVE [removable=" + entities[element].removable + ", type=" + element + ", val=" + val + "]", { line: __line });    
            } else {
                B2.util.log.debug("Parser entityCleanUP REMOVE BLOCKED [removable=" + entities[element].removable + ", type=" + element + ", val=" + val + "]", { line: __line });    
            }
        }
    });
    
    result = intent.replace(/   /," ");
    result = result.replace(/  /," ");
    result = result.trim();

    if (callback) {
        callback(result);
    } else {
        return result;
    }
};

/**
 * Function used to remove stopWords
 */
B2.PARSERS.prototype.removeStopWords = function (intent, resolve, reject, callback) {
    if (B2.CORE.getIntentType(intent) != B2.intentTypes.STRING) {
        B2.util.log.debug("Parser removeStopWords WRONG TYPE [" + JSON.stringify(intent) + "]", { line: __line });
        return intent;
    }

    var stopWords = B2.PARSERS.library.stopWords;
    var arr       = brain.tokenizer(intent);
    var arrResult = [];
    var result    = undefined;

    arr.forEach(function(element) {
        if (stopWords.indexOf(element) > -1) {
            B2.util.log.debug("Parser removeStopWords REMOVE [" + element + "]", { line: __line });
        } else {
            arrResult.push(element);
        }
    });
    
    var result = arrResult.join(" ");

    if (callback) {
        callback(result);
    } else {
        return result;
    }
};

/**
 * Function used to remove accents in any language
 */
B2.PARSERS.prototype.removeAccent = function (intent, resolve, reject, callback) {
    return B2.PARSERS.removeAccent(intent, callback);
};

B2.PARSERS.removeAccent = function (intent, resolve, reject, callback) {
    if (B2.CORE.getIntentType(intent) != B2.intentTypes.STRING) {
        B2.util.log.silly("Parser removeAccent WRONG TYPE [" + JSON.stringify(intent) + "]", { line: __line });
        return intent;
    }
    
    var mapaAcentosHex 	= {
        a : /[\xE0-\xE6]/g,
        e : /[\xE8-\xEB]/g,
        i : /[\xEC-\xEF]/g,
        o : /[\xF2-\xF6]/g,
        u : /[\xF9-\xFC]/g,
        c : /\xE7/g,
        n : /\xF1/g
    };

    for ( var letra in mapaAcentosHex ) {
        var expressaoRegular = mapaAcentosHex[letra];
        intent = intent.replace( expressaoRegular, letra );
    }

    if (callback) {
        callback(intent);
    } else {
        return intent;
    }
}

/**
 * Function used to remove accents in any language
 */
B2.PARSERS.prototype.removePontuaction = function (intent, resolve, reject, callback) {
    if (B2.CORE.getIntentType(intent) != B2.intentTypes.STRING) {
        B2.util.log.debug("Parser removePontuaction WRONG TYPE [" + JSON.stringify(intent) + "]", { line: __line });
        return intent;
    }
        
    intent = intent.replace(/[&\/\\#,+\(\)$~%\.!^'"\;:*?\[\]<>]/g, '');

    if (callback) {
        callback(intent);
    } else {
        return intent;
    }
};

/**
 * Function used to replace synonyms
 */
B2.PARSERS.prototype.replaceSynonym = function (intent, resolve, reject, callback) {
    if (B2.CORE.getIntentType(intent) != B2.intentTypes.STRING) {
        B2.util.log.debug("Parser replaceSynonym WRONG TYPE [" + JSON.stringify(intent) + "]", { line: __line });
        return intent;
    }
    
    var arr       = brain.tokenizer(intent);

    arr.forEach(element => {
        if (B2.PARSERS.library.synonym[element])        
            intent = intent.replace(element, B2.PARSERS.library.synonym[element]);
    });

    if (callback) {
        callback(intent);
    } else {
        return intent;
    }
};

/**
 * Optional parser.
 * fuzzyReplacement
 */
B2.PARSERS.prototype.fuzzyReplacement = function (intent, resolve, reject, callback) {
    if (B2.configs.enableFuzzyReplacement !== undefined) {
        if (!B2.configs.enableFuzzyReplacement) {
            B2.util.log.warn("PARSER fuzzyReplacement DISABLED!!!", { line: __line });
            if (callback) {
                callback(intent);
            } else {
                return intent;
            }               
        }
    }

    var data = B2.PARSERS.library.fuzzyDB;
    var fuzzyScore = 83;

    if (B2.configs.fuzzyScore !== undefined)
        fuzzyScore = B2.configs.fuzzyScore;

    var fuzzySearch = new FuzzySearch(data, {'minimumScore': 300});
    fuzzySearch.addModule(levenshteinFS({'maxDistanceTolerance': 3, 'factor': 3}));
    fuzzySearch.addModule(indexOfFS({'minTermLength': 3, 'maxIterations': 500, 'factor': 3}));
    fuzzySearch.addModule(wordCountFS({'maxWordTolerance': 3, 'factor': 1}));
    
    var tokenized = brain.tokenizer(intent);
    var r = [];

    tokenized.forEach(function(e){
        if (e.length < 3) {
            r.push(e);
        } else {
            var result = fuzzySearch.search(e);            
            if (result != undefined) {
                var score = result[0].details[0].score;
                var value = result[0].value;
                
                B2.util.log.debug("PARSER fuzzyReplacement: [original=" + e + ", score=" + score + ", value=" + value + "]", { line: __line });
                B2.util.log.silly("PARSER fuzzyReplacement details: [result=" + JSON.stringify(result) + "]", { line: __line });
                
                if (score > fuzzyScore) {
                    r.push(value);
                } else {
                    r.push(e);    
                }                
            } else {
                B2.util.log.debug("PARSER fuzzyReplacement: [result=" + result + "]", { line: __line });
                r.push(e);
            }
        }
    });

    intent = r.join(" ");

    if (callback) {
        callback(intent);
    } else {
        return intent;
    }    
};

B2.PARSERS.evaluateParameters = function (expression, val, callback) {
    var value = val;

    try {
      value = eval(expression);
      B2.util.log.debug("evaluateParameters: [expression: " + expression + "][value=" + value + "]]", { line: __line });
    } catch (e) {
      B2.util.log.error("evaluateParameters: Error evaluating dynamic parameters.. " + e, { line: __line });
    }

    if (value == undefined) {
      B2.util.log.debug("evaluateParameters: Error evaluating dynamic parameters.. using defaults [" + val + "]", { line: __line });
      value = val;
    }

    if (callback) {
        callback(value);
    } else {
        return value;
    }
}

/**
 * used to eval some dynamic parameters
 */
B2.PARSERS.prototype.evaluateParameters = function (expression, val, callback) {
    B2.PARSERS.evaluateParameters(expression, val, callback);
};

B2.PARSERS.dateFormat = function (date, format) {
    return dateFormat(date, format);
};

/**
 * Function used to replace values in response payloads
 */
B2.PARSERS.prototype.evaluateReplaceParameters = function (backendResponse, resolve, reject, callback) {
    B2.util.log.debug("Event BEFORE PARSER evaluateReplaceParameters [" + JSON.stringify(backendResponse) + "]", { line: __line });

    var keys = Object.keys(backendResponse);

    for (var i = 1; i < keys.length; i++) {
        var key   = keys[i];
        var value = backendResponse[key];
        
        if (typeof backendResponse[key] == "string") {
            var groupRegex = /\${(.*?)}/g;
            var match = groupRegex.exec(backendResponse[key]);
            while (match != null) {
                var evaluated = "";
                try {
                    var str = "core.metrics." + match[1];
                    evaluated = eval(str);
                } catch(err){}

                backendResponse[key] = backendResponse[key].replace(match[0], evaluated);

                B2.util.log.debug("evaluateReplaceParameters [key=" + key + ", found=" + match[0] + ", evaluated=" + evaluated + "]", { line: __line });

                match = groupRegex.exec(backendResponse[key]);
            }            
        }
    }

    B2.util.log.debug("Event AFTER PARSER evaluateReplaceParameters [" + JSON.stringify(backendResponse) + "]", { line: __line });
    
    if (callback) {
        callback(backendResponse);
    } else {
        return backendResponse;
    }
};

B2.PARSERS.prototype.temporal = function (intent, resolve, reject, callback) {
    var temporal = B2.getModule("TEMPORAL", core);

    var tempEntities = temporal.getTemporalEntities(intent);

    core.metrics.entities = [];
    core.metrics.temporalEntities = [];

    if (tempEntities)
        Object.keys(tempEntities).forEach(key => {
            var element = tempEntities[key];

            core.metrics.temporalEntities.push(element);

            var e = { 
                type: 'sbf:temporal',
                value: element.entity,
                removable: true 
            }

            core.metrics.entities.push(e);
        });

    return intent;
};

module.exports = B2.PARSERS;