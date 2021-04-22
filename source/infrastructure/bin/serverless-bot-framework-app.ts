#!/usr/bin/env node
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

import { App, Aspects} from '@aws-cdk/core';
import { AwsSdkConfig } from './aws-sdk-config-aspect';
import { ServerlessBotFrameworkStack } from '../lib/serverless-bot-framework-stack';

const app = new App();
const solutionId = 'SO0027';
const stack = new ServerlessBotFrameworkStack(app, 'serverless-bot-framework', {
  description:
    '(SO0027) - Serverless-bot-framework Solution. Version %%VERSION%%',
  solutionID: solutionId,
  solutionName: 'serverless-bot-framework',
});

Aspects.of(stack).add(new AwsSdkConfig(app, `CustomUserAgent`, solutionId));
