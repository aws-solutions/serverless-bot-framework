'use strict';

var B2 = require('b2.core');

module.exports.handler = (event, context, callback) => {
  B2.init(undefined, function(core){
      core.resolveIntent(event, function(){
          core.on('simpleResponse', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(event, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });                                
          });

          core.on('backendResponse', function(data){
            data = B2.CORE.cleanBinary(data);                                
            core.checkIfVoiceIsNeeded(event, data, function(data){
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });                                
          });

          core.on('history', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(event, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });                     

          core.on('syncConversation', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(event, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });  

          core.on('asyncConversation', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(event, data, function(data){                    
              B2.util.log.debug(JSON.stringify(data), { line: __line });
              core.endRequest();
              callback(null, data);
            });
          });  

          core.on('moreInformationNeeded', function(data){
              data = B2.CORE.cleanBinary(data);
              core.checkIfVoiceIsNeeded(event, data, function(data){                    
                B2.util.log.debug(JSON.stringify(data), { line: __line });
                core.endRequest();
                callback(null, data);
              });
          });    

          core.on('noIntentFound', function(data){
            data = B2.CORE.cleanBinary(data);
              core.checkIfVoiceIsNeeded(event, data, function(data){                    
                B2.util.log.debug(JSON.stringify(data), { line: __line });
                core.endRequest();
                callback(null, data);
              });
          });

          core.on('federated', function(data){
            data = B2.CORE.cleanBinary(data);
            core.checkIfVoiceIsNeeded(event, data, function(data){                    
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