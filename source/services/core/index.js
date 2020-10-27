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

'use strict';

var B2 = require('b2.core');

module.exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let parsedEvent = {
    userInfo: event.userInfo,
    ...event.body,
  };
  console.log(JSON.stringify(parsedEvent));
  B2.init(undefined, function(core){
      core.resolveIntent(parsedEvent, function(){
          core.on('simpleResponse', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });                                
          });

          core.on('backendResponse', function(data){
            data = B2.CORE.cleanBinary(data);                                
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });                                
          });

          core.on('history', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });                     

          core.on('syncConversation', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });  

          core.on('asyncConversation', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });  

          core.on('moreInformationNeeded', function(data){
              data = B2.CORE.cleanBinary(data);
              core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
                B2.util.log.debug(JSON.stringify(data), { line: __line });
                core.endRequest();
                callback(null, data);
              });
          });    

          core.on('noIntentFound', function(data){
            data = B2.CORE.cleanBinary(data);
              core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
                B2.util.log.debug(JSON.stringify(data), { line: __line });
                core.endRequest();
                callback(null, data);
              });
          });

          core.on('federated', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(parsedEvent, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
        });

        core.on('completed', function(data){
            data = B2.CORE.cleanBinary(data);
            B2.util.log.debug("Intent Resolution Completed: [response=" + JSON.stringify(data) + "]", { line: __line });
            B2.util.log.info("Intent Resolution Completed", { line: __line });
        });            
      });    
  });
};
