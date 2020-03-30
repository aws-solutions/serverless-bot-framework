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

/**
 * Internal plugins file.
 */

String.prototype.isEmpty = function() {
    return (!this || 2 === this.length);
}

String.prototype.startsWith = function (str) {
    return !this.indexOf(str);
}

console.time = function(label) {
  this._times.set(label, Date.now());
};

console.timeEnd = function(label) {
  var time = this._times.get(label);
  if (!time) {
    throw new Error('No such label: ' + label);
  }
  var duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        var path = require('path');
        global.appRoot = path.dirname(require.main.filename) + "/";

        var fileName   = __stack[2].getFileName();
        if (fileName) {
            var sFile = fileName.split("/");

            if (sFile.length > 1) {
                fileName = sFile[sFile.length - 2] + "/" + sFile[sFile.length - 1];
            }
        }
        return fileName + ":" + __stack[2].getLineNumber();
    },
});
