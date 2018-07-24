var percentile        = require("stats-percentile");
var path              = require("path");
var AWS               = require('aws-sdk');
var fs                = require('fs');
var AdmZip            = require('adm-zip');
var s3                = new AWS.S3();
var _                 = require('underscore');
var natural           = require('natural'),
    classifier  = new natural.BayesClassifier();
    var ntokenizer   = new natural.RegexpTokenizer({pattern: / /});

module.exports = function (trainSet, trainedKnowledge, brainConfigs, bucket, matrixConfusion, kb, entities) {
    var _self = this;
    var ntokenizer   = new natural.RegexpTokenizer({pattern: / /});

    return new Promise(function(resolve, reject) {
        function tokenizer (intent, callback) {
            var arr = [];

            ntokenizer.tokenize(intent).forEach(function(p){
                arr.push(p);
            });

            return arr;
        };

        function createWordCloud (paramArr) {
            var finalArr = [];

            paramArr.forEach(function(intent){
                tokenizer(intent).forEach(function(w){
                    if (!_.contains(finalArr, w)) {
                        finalArr.push(w);
                    }
                });
            });

            return finalArr;
        }

        var execCache = new Date().getTime();

        var amcModel          = {};
        var amcCountModel     = {};
        var avgIntentGlobal   = 0;
        var intentWordCounter = [];
        var sb_metrics        = {};

        // SB Metrics
        Object.keys(trainedKnowledge).forEach(key =>  {
            if (sb_metrics.totalKnowledges) {
                sb_metrics.totalKnowledges = sb_metrics.totalKnowledges + 1;
            } else {
                sb_metrics.totalKnowledges = 1;
            }

            var totalIntents = 0;
            if (trainedKnowledge[key]._intents)
                totalIntents = trainedKnowledge[key]._intents.length;

            if (sb_metrics.totalIntents) {
                sb_metrics.totalIntents = sb_metrics.totalIntents + totalIntents;
            } else {
                sb_metrics.totalIntents = totalIntents;
            }

            if (sb_metrics.maxIntentsByKnowledge) {
                if (totalIntents >= sb_metrics.maxIntentsByKnowledge)
                    sb_metrics.maxIntentsByKnowledge = totalIntents;
            } else {
                sb_metrics.maxIntentsByKnowledge = totalIntents;
            }

            if (sb_metrics.minIntentsByKnowledge) {
                if (totalIntents <= sb_metrics.minIntentsByKnowledge)
                    sb_metrics.minIntentsByKnowledge = totalIntents;
            } else {
                sb_metrics.minIntentsByKnowledge = totalIntents;
            }

            if (trainedKnowledge[key]._intents)
                trainedKnowledge[key]._wordCloud = createWordCloud(trainedKnowledge[key]._intents);
        });

        sb_metrics.avgIntentsByKnowledge = sb_metrics.totalIntents / sb_metrics.totalKnowledges;
        // END SB Metrics

        // Train Model
        trainSet.forEach(function(item){
            var input  = item.input;
            var output = item.output;

            var tmpScore = 0;

            var tokenized = tokenizer(input);

            intentWordCounter.push(tokenized.length);

            tokenized.forEach(function(w){
                var wna = w;
                tmpScore = tmpScore + w.length;

                if (amcModel[w] === undefined) {
                    amcModel[w] = [];
                    amcCountModel[w] = 1;
                } else {
                    amcCountModel[w] = amcCountModel[w] + 1;
                }

                if (amcModel[wna] === undefined) {
                    amcModel[wna] = [];
                }

                var contain = false;
                amcModel[w].forEach(function(c){
                    if (c == output) {
                        contain = true;
                    }
                });

                if (!contain) {
                    amcModel[w].push(output);
                }

                var contain = false;
                amcModel[wna].forEach(function(c){
                    if (c == output) {
                        contain = true;
                    }
                });

                if (!contain) {
                    amcModel[wna].push(output);
                }
            });

            avgIntentGlobal = avgIntentGlobal + tmpScore;
        });

        // TFIDF Scores
        var keysTFIDF = Object.keys(amcCountModel);
        var max       = 0;
        var min       = 0;
        var total     = 0;
        var tmpAvg    = 0;

        keysTFIDF.forEach(function(key){
            var value = amcCountModel[key];

            tmpAvg = tmpAvg + value;

            if (value >= max)
                max = value;

            if (min == 0)
                min = max;

            if (value <= min)
                min = value;

            total = total + 1;
        });

        var totalWordCounter = 0;
        intentWordCounter.forEach(function(iwc){
            totalWordCounter = totalWordCounter + iwc;
        });

        var totalPresenceCounter = 0;
        Object.keys(amcCountModel).forEach(function(key){
            var acm = amcCountModel[key];
            totalPresenceCounter = totalPresenceCounter + acm;
        });

        var score                = {};
        score.max                = max;
        score.min                = min;
        score.total              = total;
        score.avgModel           = tmpAvg / keysTFIDF.length;
        score.avgIntentModel     = avgIntentGlobal / trainSet.length;
        score.avgWordIntentModel = totalWordCounter / intentWordCounter.length;
        score.avgPresenceModel   = totalPresenceCounter / Object.keys(amcCountModel).length;

        var model                    = {};
        model.knowledge              = trainedKnowledge;
        model.source                 = kb;
        model.statistics             = {};
        model.statistics.percentile  = {};
        model.statistics.idx         = {};
        model.statistics.tfidf       = {};
        model.statistics.tfidf.score = score;

        var rangePercentile = [];
        var presencePercentile = [];
        var distributionPercentile = [];
        Object.keys(amcModel).forEach(function(key){
            var importance = amcModel[key].length / amcCountModel[key];

            if (amcModel[key].length == 1)
                importance = 1;

            var score      = importance * key.length;

            model.statistics.idx[key] = {
                "l": key.length,
                "p": amcCountModel[key],
                "d": amcModel[key].length,
                "i": importance,
                "s": score,
                "rel": amcModel[key]
            };

            presencePercentile.push(amcCountModel[key]);
            distributionPercentile.push(amcModel[key].length);

            rangePercentile.push(score);
        });

        // Default values to Percentil Calculations
        var minPercentile = 2;
        var avgPercentile = 50;
        var maxPercentile = 90;

        if (brainConfigs.minPercentile)
            minPercentile = brainConfigs.minPercentile;

        if (brainConfigs.avgPercentile)
            avgPercentile = brainConfigs.avgPercentile;

        if (brainConfigs.maxPercentile)
            maxPercentile = brainConfigs.maxPercentile;

        model.statistics.percentile.min = percentile(rangePercentile, minPercentile);
        model.statistics.percentile.avg = percentile(rangePercentile, avgPercentile);
        model.statistics.percentile.max = percentile(rangePercentile, maxPercentile);
        model.sb_metrics                = sb_metrics;

        presencePercentile     = _.uniq(presencePercentile);
        distributionPercentile = _.uniq(distributionPercentile);

        // Distribution
        var mind = _.min(distributionPercentile);
        var maxd = _.max(distributionPercentile);
        var p10d = percentile(distributionPercentile, 10);

        model.statistics.percentile.lowDistScore = 100 - (((p10d - mind) * 100) / (maxd - mind));

        var minp = _.min(presencePercentile);
        var maxp = _.max(presencePercentile);
        var p10p = percentile(presencePercentile, 10);

        model.statistics.percentile.lowPresenceScore = 100 - (((p10p - minp) * 100) / (maxp - minp));

        rangePercentile = [];

        Object.keys(model.statistics.idx).forEach(function(key){
            var inputd = model.statistics.idx[key].d;
            model.statistics.idx[key].reld = 100 - (((inputd - mind) * 100) / (maxd - mind));

            var inputp = model.statistics.idx[key].p;
            model.statistics.idx[key].relp = 100 - (((inputp - minp) * 100) / (maxp - minp));

            model.statistics.idx[key].relscore = model.statistics.idx[key].reld + model.statistics.idx[key].relp;

            rangePercentile.push(model.statistics.idx[key].relscore);

            if (_.contains(entities, key)) {
                model.statistics.idx[key].entity = true;
            }
        });

        model.statistics.percentile.relmin = percentile(rangePercentile, minPercentile);

        var json = JSON.stringify(model);

        console.log("/tmp/brain-amcClassificationsImpl-" + execCache + ".json");

        var csvFile = "";
        // Generate CSV
        csvFile += "word,length,presence,distribution,relp,reld,relscore" + "\n";
        Object.keys(model.statistics.idx).forEach(function(key){
            var item = model.statistics.idx[key];
            csvFile += key + "," + item.length + "," + item.p + "," + item.d + "," + item.relp + "," + item.reld + "," + item.relscore + "\n";
        });

        fs.writeFile("/tmp/word-distribution-" + execCache + ".csv", csvFile, {encoding: "binary"}, function(err) {
            if(err) {
                reject(err);
            }

            var fileStreamWD = fs.createReadStream("/tmp/word-distribution-" + execCache + ".csv");
            var paramsPUTWD = {
                Bucket: bucket,
                Key: "word-distribution.csv",
                Body: fileStreamWD
            }
            s3.putObject(paramsPUTWD, function(err, data){
                if(err)
                    reject(err);

                console.log("word distribution completed!");
            });
        });

        fs.writeFile("/tmp/confusion-matrix-" + execCache + ".json", JSON.stringify(matrixConfusion), function(err) {
            if(err) {
                reject(err);
            }

            var fileStreamCM = fs.createReadStream("/tmp/confusion-matrix-" + execCache + ".json");
            var paramsPUTAmc = {
                Bucket: bucket,
                Key: "confusion-matrix.json",
                Body: fileStreamCM
            }
            s3.putObject(paramsPUTAmc, function(err, data){
                if(err)
                    reject(err);

                console.log("matrixConfusion completed => " + matrixConfusion.length);
            });
        });

        fs.writeFile("/tmp/brain-amcClassificationsImpl-" + execCache + ".json", json, function(err) {
            if(err) {
                reject(err);
            }

            if ((process.env.uploadSource) && (process.env.uploadSource == "true")) {
                var fileStreamJSON = fs.createReadStream("/tmp/brain-amcClassificationsImpl-" + execCache + ".json");
                var paramsPUTJson = {
                    Bucket: bucket,
                    Key: "brain-amcClassificationsImpl.json",
                    Body: fileStreamJSON
                }
                s3.putObject(paramsPUTJson, function(err, data){
                    if(err)
                        reject(err);
                });
            }

            var zipper = new AdmZip();
            zipper.addLocalFile("/tmp/brain-amcClassificationsImpl-" + execCache + ".json");
            var zipBuffer = zipper.toBuffer();

            var paramsPUTAmc = {
                Bucket: bucket,
                Key: "brain-amcClassificationsImpl.pgk",
                Body: zipBuffer
            }

            s3.putObject(paramsPUTAmc, function(err, data){
                if(err)
                    reject(err);

                console.log("amcTrainer completed!");
                resolve(sb_metrics);
            });
        });
    });
};