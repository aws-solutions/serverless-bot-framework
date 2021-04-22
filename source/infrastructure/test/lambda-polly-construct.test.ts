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
import '@aws-cdk/assert/jest';

test('test LambdaToPolly construct', () => {
  const stack = new Stack();

  new LambdaToPolly(stack, 'PollyLambdaToPolly', {
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

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
