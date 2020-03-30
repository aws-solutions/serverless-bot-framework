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
var dateFormat = require('dateformat');
var moment  = require('moment');

B2.TEMPORAL = function () {Emitter.call(this);}
util.inherits(B2.TEMPORAL, Emitter)

B2.TEMPORAL.library = {};

var instance ;
var core;
var brain;

B2.TEMPORAL.getInstance = function (coreInstance) {
    core  = coreInstance;

    instance = new B2.TEMPORAL();
    return instance;   
};

B2.TEMPORAL.prototype.getTemporalEntities = function (intent, callback) {
    if (B2.TEMPORAL.library.locale)
        moment.locale(B2.TEMPORAL.library.locale);

    if (B2.TEMPORAL.library.expressions) {
        var items    = [];
        var grams    = B2.BRAIN.returnNGrams(intent, 1);
        var biGrams  = B2.BRAIN.returnNGrams(intent, 2);
        var triGrams = B2.BRAIN.returnNGrams(intent, 3);
    
        triGrams.forEach(element => {
            items.push(element.join(" "));
        });
    
        biGrams.forEach(element => {
            items.push(element.join(" "));
        });    
    
        grams.forEach(element => {
            items.push(element.join(" "));
        });
    
        var temporalResults = {};
        var overridenItems  = [];
    
        items.forEach(element => {
            var key  = B2.TEMPORAL.library.expressions[element];
    
            var resultado;
    
            if (key) {
                try {
                    resultado = eval(key.exp);
                } catch (e) {
                    console.log(e);
                }
            }
    
            if (resultado) {
                temporalResults[element] = {
                    "entity": element,
                    "value": resultado
                }
    
                if (key.override) {
                    overridenItems.push(key.override);
                }
            }
        });
    
        overridenItems.forEach(element => {
            delete temporalResults[element];
        });
    
        return temporalResults;        
    } else {
        return undefined;
    }
};

module.exports = B2.TEMPORAL;