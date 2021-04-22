/**********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICNSE-2.0                                                                     *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { SynthUtils } from '@aws-cdk/assert';
import { Stack, Aws, Duration } from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { LambdaToPolly } from '../lib/lambda-polly-construct';
import { CoreLambda } from '../lib/corelambda-construct';
import { CloudfrontStaticWebsite } from '../lib/cloudfront-static-website-construct';
import { CognitoApiLambda } from '../lib/cognito-api-lambdas-construct';
import '@aws-cdk/assert/jest';

test('test CognitoApiLambda construct', () => {
  const stack = new Stack();

  const coreLambdaConstruct = new CoreLambda(
    stack,
    'coreLambda',
    {
      lambdaFunctionProps: {
        functionName: `${Aws.STACK_NAME}-CoreLambda`,
        description: 'Serverless-bot-framework Core lambda',
        runtime: Runtime.NODEJS_12_X,
        code: Code.fromAsset('../services/core'),
        handler: 'index.handler',
        timeout: Duration.minutes(5),
        memorySize: 1024,
        environment: {
          botName: 'Joe',
          botGender: 'Male',
          botLanguage: 'English',
          forceCacheUpdate: 'false',
        },
      },
    }
  );

  const lambdaToPolly = new LambdaToPolly(stack, 'PollyLambdaToPolly', {
    lambdaFunctionProps: {
      functionName: `${Aws.STACK_NAME}-PollyLambda`,
      description: 'Serverless-bot-framework Polly lambda',
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset('../services/polly-service'),
      handler: 'index.handler',
      timeout: Duration.minutes(5),
      memorySize: 128,
    },
  });

  const cloudfrontStaticWebsite = new CloudfrontStaticWebsite(
    stack,
    'CloudfrontStaticWebsite'
  );

  new CognitoApiLambda(stack, 'CognitoApiCorePollyLambda', {
    coreLambda: coreLambdaConstruct.coreLambda,
    pollyLambda: lambdaToPolly.pollyLambda,
    adminUserName: 'fakeUserName',
    adminEmail: 'fakeEmail',
    webClientDomainName: cloudfrontStaticWebsite.domainName,
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
