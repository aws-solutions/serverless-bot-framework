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

require('./plugins.js');
var Dispatcher = require('dispatcherjs');
var dispatcher;
var path   = require('path');
var http   = require('http');
var fs     = require("fs");
var AWS    = require('aws-sdk');
var s3     = null;

var B2 = {
  VERSION: '1.0.0',
  util: {
      log: require('./logger.js')
  },
  i18n: {},
  ext: {},
  parsers: {},
  dataEnrichment: {},
  instances: [],
  events: ((dispatcher) || (dispatcher = new Dispatcher())),
  intentTypes:   {STRING: 0, OBJECT: 1},
  objTypes:   {STRING: 0, OBJECT: 1},
  responseTypes: {SIMPLE: 0, ASYNC: 1, SYNC: 2, HISTORY: 3, LAMBDA: 4, COMMAND: 5, TREE: 6},
  serviceTypes:   {LAMBDA: 0, STEPFUNCTIONS: 1},
  knowledgeCacheHit: ""
}

var loadExtensions = false;

/**
 * Function used to initialize CORE
 * @param {*} configs
 * @param {*} callback
 */
B2.init = function(configs, callback){
    var metrics  = {};
    B2.instances = [];

    var startTime = new Date().getTime();
    s3 = new AWS.S3();

    if (process.env.AWS_REGION != undefined) {
      if (process.env.bucketName === undefined) {
        B2.util.log.error("Error loading env [process.env.bucketName]", { line: __line });
        return;
      }
    }

    var loadModules = function () {
      var startLoadModulesTime = new Date().getTime();
      B2.loadModules(function (){
          B2.util.log.info('All modules are loaded sucessfully!', { line: __line });

          var endLoadModulesTime = new Date().getTime();
          metrics.totalLoadModulesTime = endLoadModulesTime - startLoadModulesTime;

          if (loadExtensions) {
            var extFile = "http://s3.amazonaws.com/" + B2.configs.bucketName + "/extensions.js";
            B2.util.log.debug("Customer Extension File [" + extFile + "]", { line: __line });

            // Load customers extensions
            var startLoadExtensionsTime = new Date().getTime();
            B2.getRemoteFile(extFile, function(content){
              if (content != undefined) {
                B2.util.log.debug("Loaded Extension File... Evaluating Content :)", { line: __line });
                try {
                  eval(content);
                  B2.util.log.info("Extension File Evaluated..", { line: __line });
                } catch (e) {
                  B2.util.log.error("ERROR Evaluating Extension File: " + e, { line: __line });
                }
              }

              var endLoadExtensionsTime = new Date().getTime();
              metrics.totalLoadExtensionsTime = endLoadExtensionsTime - startLoadExtensionsTime;

              B2.util.log.info('Initialization completed! ;)', { line: __line });

              var instance = B2.CORE.getInstance();
              instance.metrics.initTimes = metrics;
              instance.metrics.startTime = startTime;
              if (callback) {callback(instance);}
            });
          } else {
            B2.util.log.debug("Extension File DISABLED!!!", { line: __line });
            B2.util.log.info('Initialization completed! ;)', { line: __line });

            var instance = B2.CORE.getInstance();
            instance.metrics.initTimes = metrics;
            instance.metrics.startTime = startTime;
            if (callback) {callback(instance);}
          }
      });
    };

    if (configs === undefined) {
      B2.loadConfigFile(function(m){
        metrics = m;
        loadModules();
      });
    } else {
      B2.util.log.debug('Initializing Serverless Bot Framework [version=%s]', B2.VERSION, { line: __line });

      try {
        configs = JSON.parse(configs);
      } catch (ex) {B2.util.log.error("Error Parsing... Continue!", { line: __line });}

      B2.configs = configs;
      B2.util.log.debug('Configurations [%s]', JSON.stringify(B2.configs), { line: __line });

      if (B2.configs.loadExtensions !== undefined)
        loadExtensions = B2.configs.loadExtensions;

      loadModules();
    }
}

/**
 * Function used to load config file from S3 Bucket
 * @param {*} callback
 */
B2.loadConfigFile = function (callback){
  var metrics = {};
  var configFile = "http://s3.amazonaws.com/" + process.env.bucketName + "/configs.json";
  B2.util.log.debug("Configuration File [" + configFile + "]", { line: __line });

  var startLoadConfigTime = new Date().getTime();
  B2.getRemoteFile(configFile, function(content){
    var endLoadConfigTime = new Date().getTime();
    metrics.totalLoadConfigTime = endLoadConfigTime - startLoadConfigTime;
    B2.util.log.info('Initializing B2 [version=%s]', B2.VERSION, { line: __line });

    try {
      content = JSON.parse(content);
    } catch (ex) {B2.util.log.error(ex);}

    B2.configs = content;
    B2.util.log.info('Configurations [%s]', JSON.stringify(B2.configs), { line: __line });

    if (B2.configs.loadExtensions !== undefined)
      loadExtensions = B2.configs.loadExtensions;

    B2.configs.bucketName = process.env.bucketName;

    if (callback) {callback(metrics);}
  });
};

B2.destroy = function(){
  B2 = {};
}

/**
 * Load all modules in LIB folder
 * @param {*} callback
 */
B2.loadModules = function (callback) {
  var lazzyLoadModules = false;

  if (B2.configs.lazzyLoadModules !== undefined)
    lazzyLoadModules = B2.configs.lazzyLoadModules;

  if (lazzyLoadModules) {
    var file = "b2.core.js";
    require("./lib/" + file);
    B2.util.log.debug("Loading J Modules [" + file + "]", { line: __line });
    if (callback) {
      callback();
      return;
    }
  } else {
    var file = "b2.core.js";
    require("./lib/" + file);
    B2.util.log.debug("Loading J Modules [" + file + "]", { line: __line });

    var file = "b2.brain.js";
    require("./lib/" + file);
    B2.util.log.debug("Loading J Modules [" + file + "]", { line: __line });
  }

  var normalizedPath = require("path").join(__dirname, "lib");
  var files = fs.readdirSync(normalizedPath);

  files.forEach(function(file) {
    var split_file = file.split(".");

    if (split_file[split_file.length - 1] == "js") {
      require("./lib/" + file);
      B2.util.log.debug("Loading J Modules [" + file + "]", { line: __line });
    }
  });

  if (callback) {
    callback();
  }
}

/**
 * Function used to lazy load modules
 * @param {*} module
 * @param {*} core
 * @param {*} callback
 */
B2.getModule = function (module, core, callback) {
  var obj;

  if (B2[module] === undefined) {
    B2[module] = require("./lib/b2." + module.toLowerCase() + ".js");
  }

  if (core === undefined) {
    B2.instances[module] = B2[module].getInstance(core);
    obj = B2.instances[module];
  } else {
    core.instances[module] = B2[module].getInstance(core);
    obj = core.instances[module];
  }

  if (callback) {
    callback(obj);
  } else {
    return obj;
  }
};

/**
 * Used to register custom callback events
 */
B2.register = function (callback, codeToExec) {
  B2.util.log.debug("Registered Callback [callbackName=" + callback + "]", { line: __line });
  B2.ext[callback] = codeToExec;
};

/**
 * Used to register custom parsers
 */
B2.addParser = function (callback, codeToExec) {
  B2.util.log.debug("Added Parser [parserName=" + callback + "]", { line: __line });
  B2.parsers[callback] = codeToExec;
};

/**
 * Used to register custom dataEnrichment
 */
B2.addDataEnrichment = function (callback, codeToExec) {
  B2.util.log.debug("Added Data Enrichment [enrichmentName=" + callback + "]", { line: __line });
  B2.dataEnrichment[callback] = codeToExec;
};

/**
 * Function used to load files from S3.
 * Designed to provide cache capabilities
 * @param {*} file
 * @param {*} callback
 */
B2.getRemoteFile = function (file, callback) {
  try {
    B2.getTmpCacheFile(file, function(tmpCache){
      if (tmpCache != undefined) {
        var split_file = file.split("/");
        B2.util.log.info("Loaded File From Cache [fileName=/tmp/" + split_file[split_file.length - 1] + "]", { line: __line });
        B2.knowledgeCacheHit = "HIT";

        if (callback) {
          callback(tmpCache);
          return;
        } else {
          return tmpCache;
        }
      } else {
        B2.util.log.info("Invalid Cache.. Loading File [file=" + file + "] from S3...", { line: __line });
        B2.knowledgeCacheHit = "MISS";
        var split_file = file.split("/");
        var fileName = split_file[split_file.length - 1];
        var bucketName = undefined;

        if (B2.configs != undefined) {
          bucketName = B2.configs.bucketName;
        }

        if (bucketName == undefined) {
          bucketName = process.env.bucketName;
        }

        var params = {
            Bucket: bucketName,
            Key: fileName,
            ResponseCacheControl: "no-store"
        }

        s3.getObject(params, function(err, json_data){
          if (err) {
            B2.util.log.error("Error Loading File [file=" + fileName + "]", { line: __line });
            B2.util.log.error(err, { line: __line });
            if (callback) {callback(undefined);return;} else {return undefined;}
          }
          if (!err) {
            var body = new Buffer(json_data.Body);
            var cacheFile  = "/tmp/" + fileName;

            fs.writeFile(cacheFile, body, function(err) {
                if(err) {
                  B2.util.log.error("Error saving cache file [file=" + cacheFile + "]", { line: __line });

                  if (callback) {callback(body);return;} else {return body;}
                } else {
                  B2.util.log.info("Saved File [file=" + cacheFile + "] in cache...", { line: __line });
                  fs.writeFile(cacheFile + ".control", new Date().getTime(), function(err) {
                    if(err) {
                      B2.util.log.error("Error saving cache control file [file=" + cacheFile + ".control" + "]", { line: __line });
                      if (callback) {callback(body);return;} else {return body;}
                    }

                    B2.util.log.info("Saved File [file=" + cacheFile + ".control" + "] in cache...", { line: __line });
                    if (callback) {callback(body);} else {return body;}
                  });
                }
            });
          }
        });
      }
    });
  } catch (e) {
    B2.util.log.error("Error Loading Cache" + e, { line: __line });
    return undefined;
  }
};

/**
 * Function used to generate unique hash to cache mecanism
 * @param {*} str
 */
B2.generateHashCode = function (str) {
  var hash = 0;
  if (str.length == 0) return hash;
  for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
  }
  hash = "" + hash;
  hash = hash.replace("-","m");
  return hash;
}

/**
 * Audio cache loader
 * @param {*} hash
 * @param {*} callback
 */
B2.getAudioFromCache = function (hash, callback) {
  var b64encoded       = undefined;
  var enableAudioCache = true;

  if (B2.configs !== undefined)
    if (B2.configs.enableAudioCache !== undefined)
      enableAudioCache = B2.configs.enableAudioCache;

  if (!enableAudioCache) {
    B2.util.log.error("Audio Cache DISABLED [hash=" + hash + "]", { line: __line });
    if (callback) {callback(b64encoded);return;} else {return b64encoded;}
  }

  var cacheFile  = "/tmp/" + hash;
  if (fs.existsSync(cacheFile)) {
    fs.readFile(cacheFile, function(err, data){
      if (err) {
        B2.util.log.error("Error Loading Audio Cache File [hash=" + hash + "] " + err, { line: __line });
        if (callback) {callback(undefined);return;} else {return undefined;}
      }
      var b64encoded = data.toString('utf8');
      if (callback) {callback(b64encoded);return;} else {return b64encoded;}
    });
  } else {
    B2.util.log.info("No Audio Cache File Found [hash=" + hash + "]", { line: __line });
    if (callback) {callback(b64encoded);return;} else {return b64encoded;}
  }
}

/**
 * Function used to save audio files.
 * IMPORTANT: This will save cache files in /tmp inside Lambda Container
 * @param {*} hash
 * @param {*} binary
 */
B2.saveAudioCache = function (hash, binary) {
  var enableAudioCache = true;

  if (B2.configs !== undefined)
    if (B2.configs.enableAudioCache !== undefined)
      enableAudioCache = B2.configs.enableAudioCache;

  if (enableAudioCache) {
    var cacheFile  = "/tmp/" + hash;
    fs.writeFile(cacheFile, binary, function(err) {
        if(err) {
          B2.util.log.error("Error saving Audio Cache File [hash=" + hash + "]", { line: __line });
        } else {
          B2.util.log.info("Saved Audio File [hash=" + hash + "] in cache...", { line: __line });
        }
    });
  }
}

/**
 * TMP File Loader
 * @param {*} file
 * @param {*} callback
 */
B2.getTmpCacheFile = function (file, callback) {
  var split_file = file.split("/");
  var cacheFile  = "/tmp/" + split_file[split_file.length - 1];

  try {
    if (process.env.forceCacheUpdate != undefined) {
      if (process.env.forceCacheUpdate == "true") {
        if (callback) {callback(undefined);return;} else {return undefined;}
      }
    }
    B2.util.log.debug("Trying to load File [file=" + cacheFile + "] from temp", { line: __line });

    var readFile = function(){
      fs.readFile(cacheFile, function(err, data){
        if (err) {
          B2.util.log.error("Error Loading Cache File [file=" + cacheFile + "] " + err, { line: __line });
          if (callback) {callback(undefined);return;} else {return undefined;}
        }
        // var content = data.toString('utf8');
        var content = data;
        if (callback) {callback(content);return;} else {return content;}
      });
    }

    // Cache TTL Validation
    if (fs.existsSync(cacheFile + ".control")) {
      try {
        fs.readFile(cacheFile + ".control", function(err, ttl){
          if (err) {
            B2.util.log.error("Error Loading Cache Control File [file=" + cacheFile + "] " + err, { line: __line });
            if (callback) {callback(undefined);return;} else {return undefined;}
          }
          // Check TTL
          var diffTTL = new Date().getTime() - ttl;
          B2.util.log.debug("Found TTL [ttl=" + diffTTL + "] in cache...", { line: __line });

          if (B2.configs == undefined) {
            B2.configs = {};
            B2.configs.cacheTTL = 0;
          }

          if (diffTTL > B2.configs.cacheTTL) { // TTL > param
            B2.util.log.debug("Found TTL [ttl=" + diffTTL + " > " + B2.configs.cacheTTL + "] cache is old...", { line: __line });
            if (callback) {callback(undefined);} else {return undefined;}
          } else {
            readFile();
          }
        });
      } catch (e) {
        B2.util.log.error("Error Loading Cache Control File [file=" + cacheFile + ".control" + "] " + e, { line: __line });
        if (callback) {callback(undefined);return;} else {return undefined;}
      }
    } else { // No control file
      B2.util.log.debug("Control File NOT Found in cache... [file=" + cacheFile + ".control" + "]", { line: __line });
      if (callback) {callback(undefined);return;} else {return undefined;}
    };

  } catch (e) {
    B2.util.log.error("Error Loading Cache File [file=" + cacheFile + "] " + e, { line: __line });
    if (callback) {callback(undefined);} else {return undefined;}
  }
};

module.exports = B2;
