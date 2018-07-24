var combinatorics     = require('js-combinatorics');
var AWS               = require('aws-sdk');
var _                 = require('underscore');
var MetricsHelper     = require('./metrics-helper.js');
var moment            = require('moment');
var natural           = require('natural'),
    tokenizer   = new natural.RegexpTokenizer({pattern: / /});

var s3 = new AWS.S3();

var trainers = {};
var enabledEngines = ["amcClassificationsImpl"];

var brainConfigs = {};

var staticEntities = {};

var trainSet = [];
var trainedKnowledge = {};
var matrixConfusion  = [];
var entities         = [];
var kentities        = [];
var kb;

var removePontuaction = function (str) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }

    return str.replace(/[&\/\\#,+\(\)$~%\.!^'"\;:*?\[\]<>]/g, '');
};

var removeAccent = function (intent, callback) {
    var mapaAcentosHex  = {
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
};

var extractEntities = function (intent) {
    var expression = /{(\w*)}/g;

    var matches = intent.match(new RegExp(expression));

    if (matches) {
        matches.forEach(m => {
            entities.push(m);
            kentities.push(m);
        });
    }

    return intent;
};

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));

    var record      = event.Records[0];
    var bucket      = record.s3.bucket.name;
    var key         = record.s3.object.key;

    if (!process.env["uploadSource"]) {
        process.env["uploadSource"] = true;
    }

    var parserStack = ["removePontuaction", "removeAccent"];

    var loadModules = function () {
        return new Promise(function(resolve, reject) {
            enabledEngines.forEach(function(moduleName){
                try {
                    trainers[moduleName] = require("./" + moduleName + ".js");
                } catch (e) {
                    console.log("Fail to load Module: " + moduleName);
                    const index = enabledEngines.indexOf(moduleName);
                    if (index >= 0) {
                        enabledEngines.splice(index, 1);
                    }
                }
            });

            resolve();
        });
    };

    var execTrainers = function () {
        return new Promise(function(resolve, reject) {
            var trainList = [];

            enabledEngines.forEach(function(moduleName){
                trainList.push(trainers[moduleName](trainSet, trainedKnowledge, brainConfigs, bucket, matrixConfusion, kb, entities));
            });

            Promise.all(trainList).then(values => {
                resolve(values);
            });
        });
    };

    var params = {
        Bucket: bucket,
        Key: key
    }

    var getConfigFile = function () {
        return new Promise(function(resolve, reject) {
            var paramsConfig = {
                Bucket: bucket,
                Key: "configs.json"
            }
            s3.getObject(paramsConfig, function(err, json_data){
                if (err) {
                    reject(err);
                }
                if (!err) {
                    brainConfigs = JSON.parse(new Buffer(json_data.Body).toString("utf8"));
                    resolve();
                }
            });
        });
    };

    var getBrainFile = function () {
        return new Promise(function(resolve, reject) {
            s3.getObject(params, function(err, json_data){
                if (err) {
                    reject(err);
                }
                if (!err) {
                    kb = JSON.parse(new Buffer(json_data.Body).toString("utf8"));
                    var hits = kb.knowledge;

                    if (kb.staticEntities !== undefined)
                        staticEntities = kb.staticEntities;

                    if (brainConfigs.trainingEnabledEngines !== undefined)
                        enabledEngines = brainConfigs.trainingEnabledEngines;

                    if (brainConfigs.parserStack !== undefined)
                        parserStack = brainConfigs.parserStack;

                    console.log("staticEntities :"   + JSON.stringify(staticEntities));
                    console.log("Enabled Engines: " + enabledEngines);
                    console.log("Enabled Parsers: " + parserStack);

                    var kbm = {}

                    hits.forEach(function(index){
                        kentities = [];

                        var _id           = index._id;
                        var _intents      = index._intents;
                        var _tests        = index._tests;
                        var _cleanIntents = [];
                        var _tempIntents  = [];

                        kbm[_id] = index;

                        _intents.forEach(function(tempIntent){
                            tempIntent = tempIntent.toLowerCase();

                            // Static Entity Found.
                            var expression = /(@\w*)/g;

                            var matches = tempIntent.match(new RegExp(expression));

                            if (matches !== null) {
                                if (matches.length == 1) {
                                    var m = matches[0];
                                    var arrStaticEntity = staticEntities[m.replace("@","").toUpperCase()];

                                    if (arrStaticEntity === undefined) {
                                        tempIntent = tempIntent.replace(new RegExp(m, 'g'), "");
                                        _tempIntents.push(tempIntent);
                                        matrixConfusion.push({"desired": _id,"intent": tempIntent, "type": "canonical"});
                                    } else {
                                        arrStaticEntity.forEach(function(staticValue){
                                            var internalTempIntent = tempIntent.replace(new RegExp(m, 'g'), staticValue);
                                            _tempIntents.push(internalTempIntent);
                                            matrixConfusion.push({"desired": _id,"intent": tempIntent, "type": "canonical"});
                                        });
                                    }
                                } else if (matches.length > 1) {
                                    var cp;
                                    var add = "";

                                    matches.forEach(function(m){
                                        var arrStaticEntity = staticEntities[m.replace("@","").toUpperCase()];

                                        if (arrStaticEntity === undefined) {
                                            add = add + "[''],";
                                        } else {
                                            add = add + "[";
                                            arrStaticEntity.forEach(function(staticValue){
                                                add = add + "'" + staticValue + "',";
                                            });
                                            add = add.slice(0, -1);
                                            add = add + "],";
                                        }
                                    });
                                    add = add.slice(0, -1);
                                    add = "combinatorics.cartesianProduct(" + add + ")";

                                    cp = eval(add);
                                    var arrayPossibilities = cp.toArray();

                                    for (var k = 0; k < arrayPossibilities.length; k++) {
                                        var arrReplacement     = arrayPossibilities[k];
                                        var internalTempIntent = tempIntent;

                                        for (var j = 0; j < arrReplacement.length; j++) {
                                            internalTempIntent = internalTempIntent.replace(new RegExp(matches[j], 'g'), arrReplacement[j]);
                                        }
                                        _tempIntents.push(internalTempIntent);

                                        matrixConfusion.push({"desired": _id,"intent": internalTempIntent, "type": "canonical"});
                                    }
                                }
                            } else {
                                _tempIntents.push(tempIntent);
                                matrixConfusion.push({"desired": _id,"intent": tempIntent, "type": "canonical"});
                            }
                        });

                        _tempIntents.forEach(function(intent){
                            intent = extractEntities(intent);

                            if (parserStack.indexOf("removePontuaction") > -1) {
                                intent = removePontuaction(intent);
                            }

                            intent = intent.trim();

                            if (intent.length === 0) {
                                return;
                            }

                            var rawIntent = intent;

                            _cleanIntents.push(intent);
                            console.log("Training Intent: " + _id + " --> " + intent);

                            if (parserStack.indexOf("removeAccent") > -1) {
                                intent = removeAccent(intent);
                            }

                            if (rawIntent !== intent) {
                                _cleanIntents.push(intent);
                                console.log("Training Intent: " + _id + " --> " + intent);
                            }

                            // AMC
                            if (enabledEngines.indexOf("amcClassificationsImpl") > -1) {
                                trainSet.push({ input: intent, output: _id});

                                if (rawIntent !== intent) {
                                    trainSet.push({ input: rawIntent, output: _id});
                                }
                            }

                            resolve();
                        });

                        // uniq entities
                        entities = _.uniq(entities);

                        if (_tests) {
                            Object.keys(_tests).forEach(key => {
                                _tests[key].forEach(test_sample => {
                                    matrixConfusion.push({"desired": _id,"intent": test_sample, "type": key});
                                });
                            });
                        }

                        var tmpAvgIntents = 0;

                        function tfidf (_cleanIntents) {
                            var idx = {};

                            _cleanIntents.forEach(function(item){
                                var intentLength = 0;

                                tokenizer.tokenize(item).forEach(function(w){
                                    intentLength = intentLength + w.length;

                                    if (idx[w] === undefined) {
                                        idx[w] = 1;
                                    } else {
                                        idx[w] = idx[w] + 1;
                                    }
                                });

                                tmpAvgIntents = tmpAvgIntents + intentLength;
                            });

                            return idx;
                        }

                        var tmpKnowledge = {
                            "_id": _id,
                            "_intents": _cleanIntents,
                            "_tfidf": tfidf(_cleanIntents),
                            "_entities": _.uniq(kentities),
                            "_score": {"avgIntentsKnowledge": tmpAvgIntents / _cleanIntents.length}
                        };

                        trainedKnowledge[_id] = tmpKnowledge;
                    });
                }
            });
        });
    };

    getConfigFile()
    .then(loadModules)
    .then(getBrainFile)
    .then(execTrainers)
    .then(function(values){
        console.log(JSON.stringify(values));
        if (process.env.SEND_ANONYMOUS_USAGE_DATA === "Yes") {
            let _metricsHelper = new MetricsHelper();
            let _metric = {
                Solution: process.env.SOLUTION_ID,
                UUID: process.env.UUID,
                TimeStamp: moment().utc().format('YYYY-MM-DD HH:mm:ss.S'),
                Data: {
                    Version: process.env.VERSION,
                    DataType : "train_model",
                    Region: process.env.REGION,
                    TotalKnowledges: 0,
                    TotalIntents: 0,
                    MaxIntentsByKnowledge: 0,
                    MinIntentsByKnowledge: 0,
                    AvgIntentsByKnowledge: 0
                }
            };

            if (values && values.length > 0) {
                values.map(function(sb_metrics) {
                    _metric.Data.TotalKnowledges += sb_metrics.totalKnowledges;
                    _metric.Data.TotalIntents += sb_metrics.totalIntents;
                    _metric.Data.MaxIntentsByKnowledge += sb_metrics.maxIntentsByKnowledge;
                    _metric.Data.MinIntentsByKnowledge += sb_metrics.minIntentsByKnowledge;
                    _metric.Data.AvgIntentsByKnowledge += sb_metrics.avgIntentsByKnowledge;
                });
                _metric.Data.AvgIntentsByKnowledge = _metric.Data.AvgIntentsByKnowledge/values.length;
            }
            console.log("_metric: ", _metric);
            _metricsHelper.sendAnonymousMetric(_metric, function(err, data) {
                if (err) {
                    console.log("err: ", err);
                } else if (data) {
                    console.log("data: ", data);
                }
                callback(null, 'Train Finished!!');
            });

        } else {
            callback(null, 'Train Finished!!');
        }
    });
};