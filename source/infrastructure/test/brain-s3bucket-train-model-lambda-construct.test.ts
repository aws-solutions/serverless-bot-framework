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
import { Stack, Aws, Duration, CfnMapping } from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { CoreLambdaToBrainS3 } from '../lib/corelambda-brain-s3bucket-construct';
import { BrainS3ToTrainModelLambda } from '../lib/brain-s3bucket-train-model-lambda-construct';
import '@aws-cdk/assert/jest';

test('test BrainS3ToTrainModelLambda construct', () => {
  const stack = new Stack();

  const coreLambdaBrainS3Bucket = new CoreLambdaToBrainS3(
    stack,
    'coreLambdaBrainS3Bucket',
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

  const metricsMapping = new CfnMapping(stack, 'Solution', {
    mapping: {
      Data: {
        ID: 'SO0027',
        Version: '%%VERSION%%',
        SendAnonymousUsageData: 'Yes',
      },
    },
  });

  new BrainS3ToTrainModelLambda(stack, ' BrainS3ToTrainModelLambda', {
    trainModelLambdaProps: {
      functionName: `${Aws.STACK_NAME}-TrainModelLambda`,
      description: 'Serverless-bot-framework TrainModel lambda',
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset('../services/train-model'),
      handler: 'index.handler',
      timeout: Duration.minutes(5),
      memorySize: 128,
      environment: {
        REGION: Aws.REGION,
        SEND_ANONYMOUS_USAGE_DATA: metricsMapping.findInMap(
          'Data',
          'SendAnonymousUsageData'
        ),
        SOLUTION_ID: metricsMapping.findInMap('Data', 'ID'),
        VERSION: metricsMapping.findInMap('Data', 'Version'),
        /** TO Do add UUID from Solution Helper */
      },
    },
    brainS3Bucket: coreLambdaBrainS3Bucket.brainS3Bucket,
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
