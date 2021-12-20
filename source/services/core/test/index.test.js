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

const assert = require('assert');
const AWS = require('aws-sdk');
const core = require('../index');

test('Testing verifyLocale function', () => {
  // Should return false
  assert.throws(() => core.verifyLocale('abcd'));
  assert.throws(() => core.verifyLocale('en-us'));
  assert.throws(() => core.verifyLocale(''));
  // Should return true
  verifiedLocale = core.verifyLocale('en-US');
  expect(verifiedLocale).toBe(true);
  verifiedLocale = core.verifyLocale('es-US');
  expect(verifiedLocale).toBe(true);
  verifiedLocale = core.verifyLocale('it-IT');
  expect(verifiedLocale).toBe(true);
  verifiedLocale = core.verifyLocale('de-DE');
  expect(verifiedLocale).toBe(true);
  verifiedLocale = core.verifyLocale('fr-FR');
  expect(verifiedLocale).toBe(true);
});

test('Testing verifyEmail function', () => {
  // Should return false
  assert.throws(() => core.verifyEmail('wrongemail@'));
  assert.throws(() => core.verifyEmail('wrongemail@2'));
  assert.throws(() => core.verifyEmail('@wrongemail'));
  assert.throws(() => core.verifyEmail('wrongemail@.com'));
  assert.throws(() => core.verifyEmail(''));
  // Should return true
  verifiedEmail = core.verifyEmail('email@example.com');
  expect(verifiedEmail).toBe(true);
  verifiedEmail = core.verifyEmail('email+email@example.com');
  expect(verifiedEmail).toBe(true);
  verifiedEmail = core.verifyEmail('123email+123@example123.com');
  expect(verifiedEmail).toBe(true);
});

test('Testing tryAgainResponse function', () => {
  // Should return value
  response = core.tryAgainResponse('English');
  expect(response).toBe('I could not understand.');
  response = core.tryAgainResponse('French');
  expect(response).toBe('Je ne pouvais pas comprendre.');
  response = core.tryAgainResponse('Italian');
  expect(response).toBe('Non riuscivo a capire.');
  response = core.tryAgainResponse('Spanish');
  expect(response).toBe('No lo pude entender.');
  response = core.tryAgainResponse('German');
  expect(response).toBe('Ich konnte es nicht verstehen.');
});

test('Testing verifySub function', () => {
  // Should return false
  assert.throws(() => core.verifySub('wrongesub'));
  assert.throws(() => core.verifySub('wrongsub-abc'));
  assert.throws(() => core.verifySub(''));
  assert.throws(() => core.verifySub('a----b'));
  // Should return true
  verifiedSub = core.verifySub('77069b76-bf23-4b9b-b2ff-4ae245feca3g');
  expect(verifiedSub).toBe(true);
  verifiedSub = core.verifySub('12345678-1234-1234-1234-123456789012');
  expect(verifiedSub).toBe(true);
  verifiedSub = core.verifySub('abcdefgh-abcd-abcd-abcd-abcdefghijkl');
  expect(verifiedSub).toBe(true);
});

test('Testing getLocaleId function', () => {
  // Should throw an error
  assert.throws(() => core.getLocaleId('language'));
  assert.throws(() => core.getLocaleId('Gibberish'));
  assert.throws(() => core.getLocaleId(''));
  // Should not throw an error
  assert.doesNotThrow(() => core.getLocaleId('English'));
  assert.doesNotThrow(() => core.getLocaleId('French'));
  assert.doesNotThrow(() => core.getLocaleId('Italian'));
  assert.doesNotThrow(() => core.getLocaleId('Spanish'));
  assert.doesNotThrow(() => core.getLocaleId('German'));
});

test('Testing sanitizeEvent function', () => {
  let event = {
    "body": {
      "text": "t;e@s+<>t#",
      "pollyOnServer": true,
      "lang": "en-US"
    },
    "userInfo": {
      "email": "foo@example.com",
      "sub": "77069b76-bf23-4b9b-b2ff-4ae245feca3g"
    }
  };
  let expected = {
    text: "test",
    lang: "en-US",
    pollyOnServer: true,
    userInfo: {
      email: "foo@example.com",
      sub: "77069b76-bf23-4b9b-b2ff-4ae245feca3g"
    }
  };
  let response = core.sanitizeEvent(event);
  assert.deepStrictEqual(response, expected);
});


/** Testing Core lambda function */
test('test Core Lambda function ', () => {
  const mockedRecognizeText = jest.fn().mockImplementation(() => ({
    promise() {
      return Promise.resolve({
        messages: [{content: 'test response'}]
      })
    }
  }));
  AWS.LexRuntimeV2 = jest.fn().mockImplementation(() => ({
    recognizeText: mockedRecognizeText
  }));
  process.env = {
    botLanguage: 'English',
    botAliasId: 'TestAlias',
    botId: 'TestBotId',
  };

  const mock_event = {
    "body": {
      "text": "test",
      "pollyOnServer": true,
      "lang": "en-US"
    },
    "userInfo": {
      "email": "foo@example.com",
      "sub": "77069b76-bf23-4b9b-b2ff-4ae245feca3g"
    }
  };

  const mock_callback = () => {};
  const mock_context = {};
  core.handler(mock_event, mock_context, mock_callback);
  expect(mockedRecognizeText).toHaveBeenCalledWith({
    botAliasId: 'TestAlias',
    botId: 'TestBotId',
    localeId: 'en_US',
    text: 'test',
    "requestAttributes": {
      "email": "foo@example.com"
    },
    sessionId: '77069b76-bf23-4b9b-b2ff-4ae245feca3g'
  });
});