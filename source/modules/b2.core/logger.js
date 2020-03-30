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

const winston  = require('winston');
var dateFormat = require('dateformat'); //https://www.npmjs.com/package/dateformat

String.prototype.paddingLeft = function (paddingValue) {
  var padding = Array(paddingValue).join(' ');
  return String(padding + this).slice(-padding.length);
};

String.prototype.paddingRight = function (paddingValue) {
  var padding = Array(paddingValue).join(' ');
  return String(this + padding).substring(0, paddingValue - 1);
};

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      prettyPrint: true,
      colorize: true,
      timestamp: function() {
        var now = new Date();
        var logDateFormat = "dd/mm/yyyy HH:MM:ss.l";
        if (process.env.logDateFormat != undefined) {
          logDateFormat = process.env.logDateFormat;
        }         
        return dateFormat(now, logDateFormat);;
      },
      formatter: function(options) {
        var level = options.level.toUpperCase();
        if (level.length < 8) {
          for (var i=0; i <= (8 - level.length); i++) {
            level = level + " ";
          }    
        }

        var line = options.meta.line || "";
        line = line.paddingRight(26);

        return '[' + options.timestamp() +'] ['+ line +'] ['+ level +'] '+ (options.message ? options.message : '');
      }
    })
  ]
});

var logLevel = "info";

if (process.env.logLevel != undefined) {
  logLevel = process.env.logLevel;
} 

logger.level = logLevel;

module.exports = logger;