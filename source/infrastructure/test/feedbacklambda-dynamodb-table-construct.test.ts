/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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
import { LeaveFeedbackLambdaDynamoDBTable } from '../lib/feedbacklambda-dynamodb-table-construct';
import '@aws-cdk/assert/jest';

test('test LeaveFeedbackLambdaDynamoDBTable construct', () => {
  const stack = new Stack();

  new LeaveFeedbackLambdaDynamoDBTable(stack, 'LeaveFeedBackLambdaDynamoDB', {
    leaveFeedbackLambdaProps: {
      functionName: `${Aws.STACK_NAME}-LeaveFeedbackLambda`,
      description: 'Serverless-bot-framework LeaveFeedback Sample lambda',
      runtime: Runtime.PYTHON_3_8,
      code: Code.fromAsset('../samples/leave-feedback'),
      handler: 'index.handler',
      timeout: Duration.minutes(5),
    },
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
