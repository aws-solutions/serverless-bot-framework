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
var AWS     = require('aws-sdk');

B2.AWS = function () {}
var core;

B2.AWS.getInstance = function (coreInstance) {
    core = coreInstance;
    var instance = new B2.AWS();
    return instance;
};

/**
 * Function used to create a session in an AWS Account
 */
B2.AWS.prototype.assumeRole = function(arnRole, callback) {
  B2.util.log.debug("Starting assumeRole: " + arnRole, { line: __line });
  var sts  = new AWS.STS();
  var params = {
    RoleArn: arnRole, /* required */
    RoleSessionName: 'B2CORE', /* required */
    DurationSeconds: 900
  };
  sts.assumeRole(params, function(err, data) {
    if (err) {
      B2.util.log.error("Credentials Error: " + JSON.stringify(err), { line: __line });
      throw err;
    } else {
      B2.util.log.debug("Credentials Return: " + JSON.stringify(data), { line: __line });

      if (callback) {
        callback(data);
      }
    }
  });
};

/**
 * Polly Service Wrapper
 */
B2.AWS.prototype.polly = {
  speech: function (text, voice, callback, accent) {
    try {
      B2.util.log.debug("Starting Polly Request...", { line: __line });

      var pollyRegion = "us-east-1";
      var textType = "text";

      if (B2.configs !== undefined)
        if (B2.configs.pollyRegion != undefined)
          pollyRegion = B2.configs.pollyRegion;
        
      B2.util.log.debug("Polly Region: [region=" + pollyRegion + "]", { line: __line });

      var polly = new AWS.Polly({region: pollyRegion});

      // Verify if its a SSML
      if(text.indexOf("<speak") > -1) {
        textType = "ssml";
      }

      var params = {
        OutputFormat: 'mp3',
        Text: text, 
        VoiceId: voice, 
        TextType: textType
      };

      if (accent != undefined) {
        params.LexiconNames = [accent];
      }

      B2.util.log.debug("Polly Request Params: " + JSON.stringify(params), { line: __line });

      params = JSON.stringify(params);
      params = JSON.parse(params);

      polly.synthesizeSpeech(params, function(err, data) {
        if (err) B2.util.log.error(err.stack, { line: __line });

        if (callback) {
          callback(data);
        }
      });
    } catch (e) {B2.util.log.error("Error Using Polly " + e.stack, { line: __line });}
  }
};

/**
 * Lambda Service Wrapper
 */
B2.AWS.prototype.lambda = {
  invokeSync: function (arn, params, callback) {
    B2.util.log.debug("Exec Lambda invokeSync: " + arn, { line: __line });
    B2.util.log.debug("Exec Lambda invokeSync with Params: " + JSON.stringify(params), { line: __line });
    var awsRegion = "us-east-1";
    
    if (process.env.AWS_REGION !== undefined)
      awsRegion = process.env.AWS_REGION;

    try {
      params = JSON.parse(params);
    } catch (e) {}
    
    params = JSON.stringify(params);
    try {
      var splitArn = arn.split(":");

      if (splitArn.length > 1) {
        awsRegion = splitArn[3];
      }

      B2.util.log.debug("Exec Lambda in Region: " + awsRegion, { line: __line });

      var lambda = new AWS.Lambda({
          region: awsRegion
      });

      lambda.invoke({
          FunctionName: arn,
          InvocationType: "RequestResponse",
          Payload: params
      }, function(error, data) {
          if (error) {
            B2.util.log.error("Error Lambda: " + error, { line: __line });
            if (callback) {
                callback(undefined);
                return;
            }
          }
          if(data.Payload) {
            if (callback) {
                callback(data.Payload);
            }
          }
      });
    } catch (e) {
      B2.util.log.error("Error Lambda: " + e, { line: __line });
      if (callback) {
          callback(undefined);
          return;
      }      
    }
  },
  invokeSyncWithCredentials: function (arn, credentials, params, callback) {
    var awsRegion = "us-east-1";

    if (process.env.AWS_REGION !== undefined)
      awsRegion = process.env.AWS_REGION;


    var splitArn = arn.split(":");
    
    if (splitArn.length > 1) {
      awsRegion = splitArn[3];
    }

    B2.util.log.debug("Exec Lambda invokeSyncWithCredentials: " + arn, { line: __line });
    B2.util.log.debug("Exec Lambda invokeSyncWithCredentials with Params: " + JSON.stringify(params), { line: __line });
    B2.util.log.debug("Exec Lambda invokeSyncWithCredentials in Region: " + awsRegion, { line: __line });  

    try {
      params = JSON.parse(params);
    } catch (e) {}
    params = JSON.stringify(params);

    B2.util.log.debug("Payload: " + JSON.stringify(params), { line: __line });
  
    try {
      var lambda = new AWS.Lambda({
          region: awsRegion,
          accessKeyId: credentials.Credentials.AccessKeyId,
          secretAccessKey: credentials.Credentials.SecretAccessKey,
          sessionToken: credentials.Credentials.SessionToken
      });

      lambda.invoke({
          FunctionName: arn,
          InvocationType: "RequestResponse",
          Payload: params
      }, function(error, data) {
          if (error) {
            B2.util.log.error("Error Lambda: " + error, { line: __line });

            if (callback) {
                callback(undefined);
                return;
            }
          }
          if(data.Payload) {
            if (callback) {
                callback(data.Payload);
            }
          }
      });
    } catch (e) {
      B2.util.log.error("Error Lambda: " + e.stack, { line: __line });
      if (callback) {
          callback(undefined);
          return;
      }      
    }
  },
  invokeAsync: function (arn, params, callback) {
    var awsRegion = "us-east-1";

    if (process.env.AWS_REGION !== undefined)
      awsRegion = process.env.AWS_REGION;

    var splitArn = arn.split(":");
    
    if (splitArn.length > 0) {
      awsRegion = splitArn[3];
    }
    
    B2.util.log.debug("Exec Lambda invokeAsync: " + arn, { line: __line });
    B2.util.log.debug("Exec Lambda invokeAsync with Params: " + JSON.stringify(params), { line: __line });
    B2.util.log.debug("Exec Lambda invokeAsync in Region: " + awsRegion, { line: __line });

    try {
      params = JSON.parse(params);
    } catch (e) {}    
    params = JSON.stringify(params);

    try {
      var lambda = new AWS.Lambda({
          region: awsRegion
      });

      lambda.invokeAsync({
          FunctionName: arn,
          InvokeArgs: params
      }, function(error, data) {
        if (error) {
          B2.util.log.error("Error Lambda: " + error, { line: __line });

          if (callback) {
              callback(undefined);
              return;
          }
        }
      });
    } catch (e) {
      B2.util.log.error("Error Lambda: " + e.stack, { line: __line });
      if (callback) {
          callback(undefined);
          return;
      }      
    }
  }
};

/**
 * DynamoDB Service Wrapper
 */
B2.AWS.prototype.dynamo = {
  create: function (table, item, callback) {
    try {
      var dynamoRegion = "us-east-1";

      if (process.env.AWS_REGION !== undefined)
        dynamoRegion = process.env.AWS_REGION;
      
      var docClient = new AWS.DynamoDB.DocumentClient({
        region: dynamoRegion,
        endpoint: "dynamodb." + dynamoRegion + ".amazonaws.com"
      });

      var table = table;

      var params = {
          TableName: table,
          Item: item
      };

      docClient.put(params, function(err, data) {
          if (err) {
            B2.util.log.error("Unable to add item. Error JSON:", JSON.stringify(err), { line: __line });
            B2.util.log.error("Unable to add item. ITEM:", JSON.stringify(item), { line: __line });
            if (callback) {callback(err);}
          } else {
            B2.util.log.debug("Added item.", { line: __line });
            if (callback) {callback();}
          }
      });
    } catch (e) {
      if (callback) {callback();}
    }
  },
  createWithParams: function (params, callback) {
    try {
      B2.util.log.debug("Dynamo Params:", JSON.stringify(params), { line: __line });
      var dynamoRegion = "us-east-1";

      if (process.env.AWS_REGION !== undefined)
        dynamoRegion = process.env.AWS_REGION;
      
      var docClient = new AWS.DynamoDB.DocumentClient({
        region: dynamoRegion,
        endpoint: "dynamodb." + dynamoRegion + ".amazonaws.com"
      });

      var table = table;

      docClient.update(params, function(err, data) {
          if (err) {            
            B2.util.log.error("Unable to add item. Error JSON:", JSON.stringify(err), { line: __line });
            B2.util.log.silly("Param:", JSON.stringify(params), { line: __line });
            if (callback) {callback();}
          } else {
            B2.util.log.debug("Added item.", { line: __line });
            if (callback) {callback();}
          }
      });
    } catch (e) {
      if (callback) {callback();}
    }
  },
  delete: function () {

  },
  scan: function (query, callback) {
    try {
      B2.util.log.debug("Dynamo Query: " + JSON.stringify(query), { line: __line });

      var dynamoRegion = "sa-east-1";

      if (process.env.AWS_REGION !== undefined)
        dynamoRegion = process.env.AWS_REGION;
      
      var docClient = new AWS.DynamoDB.DocumentClient({
        region: dynamoRegion,
        endpoint: "dynamodb." + dynamoRegion + ".amazonaws.com"
      });

      docClient.scan(query, function(err, data) {
          if (err) {
            B2.util.log.error("Unable to find item. Error JSON:", JSON.stringify(err), { line: __line });

            if (callback) {callback([]);}
          } else {
            B2.util.log.debug("Total Items Found: " + data.Items.length, { line: __line });
            
            if (callback) {callback(data.Items);}
          }
      });
    } catch (e) {
      B2.util.log.error("Unable to find item. Error JSON:", JSON.stringify(err), { line: __line });
    }
  },
  query: function (query, callback) {
    try {
      B2.util.log.debug("Dynamo Query: " + JSON.stringify(query), { line: __line });

      var dynamoRegion = "sa-east-1";

      if (process.env.AWS_REGION !== undefined)
        dynamoRegion = process.env.AWS_REGION;
      
      var docClient = new AWS.DynamoDB.DocumentClient({
        region: dynamoRegion,
        endpoint: "dynamodb." + dynamoRegion + ".amazonaws.com"
      });

      docClient.query(query, function(err, data) {
          if (err) {
            B2.util.log.error("Unable to find item. Error JSON:", JSON.stringify(err), { line: __line });

            if (callback) {callback([]);}
          } else {
            B2.util.log.debug("Total Items Found: " + data.Items.length, { line: __line });
            
            if (callback) {
              callback(data.Items);
            }            
          }
      });
    } catch (e) {
      B2.util.log.error("Unable to find item. Error JSON:", JSON.stringify(err), { line: __line });
    }
  }
};

module.exports = B2.AWS;
