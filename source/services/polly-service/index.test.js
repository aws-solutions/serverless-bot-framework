/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const expect = require('chai').expect;
const AWS = require('aws-sdk-mock');
const lambdaTester = require('lambda-tester');
const pollyLambda = require('./index.js');


describe('Polly lambda test', () => {
    beforeEach(() => {
      process.env.AWS_SDK_USER_AGENT = '{ "customUserAgent": "AwsSolution/SO1234/v1.1.1" }';
    });
    afterEach(() => {
      delete process.env.AWS_SDK_USER_AGENT;
      AWS.restore('Polly');
    });

    it('Should successfully call Polly sythesize speech with correct parameters', async () => {
      const event = {
        text: "testText",
        voice: "testVoiceId",
      };
      AWS.mock('Polly', 'synthesizeSpeech', () => {
        return Promise.resolve({ data: {AudioStream: 'testdata'} });
      });

      return lambdaTester(pollyLambda.handler)
        .event(event)
        .expectResult((response) => {
          console.log(response);
        });
    });

    it('Should call Polly sythesize speech with correct parameters but fail', async () => {
      const event = {
        text: "testText",
        voice: "testVoiceId",
      };
      AWS.mock('Polly', 'synthesizeSpeech', () => {
        return Promise.reject({ message: 'errorMessage', stack: 'testErrorStack' });
      });

      return lambdaTester(pollyLambda.handler)
        .event(event)
        .expectError((err) => {
          expect(err.message).to.eq('errorMessage');
        });
    });
});