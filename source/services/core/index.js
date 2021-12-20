 /*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const AWS = require('aws-sdk');
const stringSanitizer = require('string-sanitizer');
const options = { customUserAgent: 'AwsSolution/SOL0027/1.6.0' };

function getLocaleId(language) {
  const language_locale = {
      "English": "en_US",
      "French": "fr_FR",
      "Italian": "it_IT",
      "Spanish": "es_US",
      "German": "de_DE",
      "Japanese": "ja_JP",
  };
  if(language_locale[language]){
    return language_locale[language];
  } else {
    throw('Unsupported language, supported languages are: English, French, Italian, Spanish, German, and Japanese');
  }
}
function tryAgainResponse(locale){
  const response = {
    "English": "I could not understand.",
    "French": "Je ne pouvais pas comprendre.",
    "Italian": "Non riuscivo a capire.",
    "Spanish": "No lo pude entender.",
    "German": "Ich konnte es nicht verstehen.",
    "Japanese": "申し訳ありません、内容を理解できませんでした。何をお手伝いできますでしょうか？"
  };
  return response[locale];
}

function verifyLocale(locale){
  if (/^[a-z]{2}-[A-Z]{2}/.test(locale)){ // NOSONAR regular expression here is needed to validate user inputs
    return true;
  } else {
    throw('Invalid locale, supported locales are of format: az-AZ');
  }
}
function verifyEmail(email){
  // regex source: http://emailregex.com/
  if (
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email) // NOSONAR regular expression here is needed to validate user inputs
  ){
    return true;
  } else {
    throw('Invalid email format.');
  }
}
function verifySub(sub){
  if(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/.test(sub)){ // NOSONAR regular expression here is needed to validate user inputs
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
  const parsedEvent = sanitizeEvent(event);
  console.log(JSON.stringify(parsedEvent));

  const language = process.env.botLanguage;
  const botId = process.env.botId;
  const botAliasId = process.env.botAliasId;
  try{
    const lexruntimev2 = new AWS.LexRuntimeV2({apiVersion: '2020-08-07', ...options});
    const params = {
      botAliasId: botAliasId, /* required */
      botId: botId, /* required */
      localeId: getLocaleId(language),
      text: parsedEvent['text'], /* required */
      sessionId: parsedEvent['userInfo']['sub'], /* required */
      requestAttributes: {
        'email': parsedEvent['userInfo']['email']
      }
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

};

module.exports = {
  handler,
  verifyLocale,
  verifyEmail,
  verifySub,
  sanitizeEvent,
  getLocaleId,
  tryAgainResponse,
};