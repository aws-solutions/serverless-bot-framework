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
import { Stack } from '@aws-cdk/core';
import { ServerlessBotFrameworkStack } from '../lib/serverless-bot-framework-stack';
import '@aws-cdk/assert/jest';
import { execSync } from "child_process";

beforeAll(() => {
  /** create a fake build directory for the webclient package */
  execSync(`mkdir ${__dirname}/../../samples/webclient/build`);
});

afterAll(() => {
  /** remove the fake build directory for the webclient package */
  execSync(`rm -rf ${__dirname}/../../samples/webclient/build`);
});

test('test ServerlessBotFrameworkStack stack', () => {
  const stack = new Stack();
  new ServerlessBotFrameworkStack(stack, 'ServerlessBotFrameworkStack', {
    solutionID: 'SO0027',
    solutionName: 'UnitTestExecution',
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
