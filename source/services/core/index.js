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

const B2 = require('b2.core');
const AWS = require('aws-sdk');
const stringSanitizer = require('string-sanitizer');

function getLocaleId(language) {
  const language_locale = {
      "English": "en_US",
      "French": "fr_FR",
      "Italian": "it_IT",
      "Spanish": "es_US",
      "German": "de_DE"
  };
  if(language_locale[language]){
    return language_locale[language];
  } else {
    throw('Unsupported language, supported languages are: English, French, Italian, Spanish, and German.');
  }
}
function tryAgainResponse(locale){
  const response = {
    "English": "I could not understand.",
    "French": "Je ne pouvais pas comprendre.",
    "Italian": "Non riuscivo a capire.",
    "Spanish": "No lo pude entender.",
    "German": "Ich konnte es nicht verstehen."
  };
  return response[locale];
}

function verifyLocale(locale){
  if (/^[a-z]{2}-[A-Z]{2}/.test(locale)){
    return true;
  } else {
    throw('Invalid locale, supported locales are of format: az-AZ');
  }
}
function verifyEmail(email){
  // regex source: http://emailregex.com/
  if (
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
  ){
    return true;
  } else {
    throw('Invalid email format.');
  }
}
function verifySub(sub){
  if(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/.test(sub)){
    return true;
  } else {
    throw('Invalid sub format');
  }
}

function sanitizeEvent(event) {
  const sanitizedEvent = {
    text: stringSanitizer.sanitize.keepUnicode(event['body']['text']),
    lang: verifyLocale(event['body']['lang']) ? event['body']['lang'] : "",
    pollyOnServer: event['body']['pollyOnServer'] == true,
    userInfo: {
      email: verifyEmail(event['userInfo']['email']) ? event['userInfo']['email'] : "",
      sub: verifySub(event['userInfo']['sub']) ? event['userInfo']['sub'] : ""
    }
  };
  return sanitizedEvent;
}

const handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  const selectedBrainModule = process.env.BOT_BRAIN;
  if(selectedBrainModule === 'Amazon Lex'){
    const parsedEvent = sanitizeEvent(event);
    console.log(JSON.stringify(parsedEvent));

    const language = process.env.botLanguage;
    const botId = process.env.botId;
    const botAliasId = process.env.botAliasId;
    try{
      const lexruntimev2 = new AWS.LexRuntimeV2({apiVersion: '2020-08-07'});
      const params = {
        botAliasId: botAliasId, /* required */
        botId: botId, /* required */
        localeId: getLocaleId(language),
        text: parsedEvent['text'], /* required */
        sessionId: parsedEvent['userInfo']['sub'], /* required */
      };
      lexruntimev2.recognizeText(params).promise()
        .then((data) => { // successful call
          console.log(data);
          const reponseText = ('messages' in data) ? data['messages'][0]['content'] : tryAgainResponse(language);
          callback(null, {text: reponseText});
        }).catch((err) => {
          console.error(err); // an error occurred
        });
    } catch(err) {
      console.error(err);
    }

  } else {
    const parsedEvent = {
      userInfo: event.userInfo,
      ...event.body,
    };
    CustomBrainCore(parsedEvent, callback);
  }
};

function CustomBrainCore(parsedEvent, callback) {
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
}

module.exports = {
  handler,
  verifyLocale,
  verifyEmail,
  verifySub,
  sanitizeEvent,
  getLocaleId,
  CustomBrainCore,
};