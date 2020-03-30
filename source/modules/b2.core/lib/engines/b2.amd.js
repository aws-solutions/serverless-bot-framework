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

var B2            = require('../../index.js');
var _             = require('underscore');

B2.BRAIN.prototype.auntMaricotaDistance = function (i, e, wordModel, global_tfidf) {
    var _self = this;

    var rawIntent = i;
    var rawEvent  = e;

    var idx = {};

    var intent = _self.tokenizer(i);
    var event  = _self.tokenizer(e);
    var bagMatched = [];

    var totalIntent  = 0;
    var totalEvent   = 0;
    var intentLength = 0;
    var eventLength  = 0;

    intent.forEach(function(i) {
        intentLength = intentLength + i.length;

        if (wordModel[i]) {
            var model = wordModel[i];
            var l     = model.l;
            var p     = model.p;
            var d     = model.d;
            var i     = model.i;
            var s     = model.s;
            var reld  = model.reld;
            var relp  = model.relp;
            var relscore = model.relscore;
            var entity = false;

            if (model.entity)
                entity = model.entity;

            var regex = "/" + i + "/g";
            var count = (rawIntent.match(regex) || [""]).length;

            totalIntent = totalIntent + (relscore * count);
        }
    });

    event.forEach(function(e) {
        eventLength = eventLength + e.length;
    });
    

    var detailedScore = {};
    detailedScore.words = {};

    var score = 0;
    var totalEntities = 0;

    var intersection = _.intersection(intent, event);

    intersection.forEach(e => {
        var model;

        if (wordModel[e]) {
            model = wordModel[e];
            var l     = model.l;
            var p     = model.p;
            var d     = model.d;
            var i     = model.i;
            var s     = model.s;
            var reld  = model.reld;
            var relp  = model.relp;
            var relscore = model.relscore;
            var entity = false;

            if (model.entity)
                entity = model.entity;

            var regex = "/" + e + "/g";
            var count = (rawEvent.match(regex) || [""]).length;

            totalEvent = totalEvent + (relscore * count);

            detailedScore.words[e] = {
                "l": l,
                "p": p,
                "d": d,
                "i": i,
                "s": s,
                "e": e,
                "reld": reld,
                "relp": relp,
                "relscore": relscore,
                "entity": entity,
                "wCount": count,
                "compScore": (relscore * count)
            };

            if (entity) {
                totalEntities = totalEntities + 1;
            }

            score = score + (relscore * count);
        }
    });


    var diff = (totalEvent / totalIntent);
    detailedScore.diff = diff;
    diff = (diff > 1 ? (totalIntent / totalEvent) : diff);
    diff = (diff < 0 ? diff * -1 : diff);
    diff = (diff == 0 ? 1 : diff);    
    score = score / totalEvent;
    
    var md = score * diff;
    md = (md <= 0 ? md * -1 : md);

    if (!md) {
        md = 0;
    }

    detailedScore.totalEntities = totalEntities;
    detailedScore.value = md;
    detailedScore.score = score;
    detailedScore.totalIntent = totalIntent;
    detailedScore.totalEvent = totalEvent;
    detailedScore.intentLength = intentLength;
    detailedScore.eventLength = eventLength;
    detailedScore.intersection = intersection;

    if (intersection)
        detailedScore.intersectionSize = intersection.length;

    return detailedScore;
}