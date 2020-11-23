/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
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

import { Construct } from '@aws-cdk/core';
import { Bucket, EventType } from '@aws-cdk/aws-s3';
import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { S3ToLambda } from '@aws-solutions-constructs/aws-s3-lambda';

export interface BrainS3ToTrainModelLambdaProps {
  readonly trainModelLambdaProps: FunctionProps;
  readonly brainS3Bucket: Bucket | undefined;
}

export class BrainS3ToTrainModelLambda extends Construct {
  private readonly _trainModelLambda: Function;

  constructor(
    scope: Construct,
    id: string,
    props: BrainS3ToTrainModelLambdaProps
  ) {
    super(scope, id);

    const brainS3ToTrainModelLambda = new S3ToLambda(
      this,
      'BrainS3ToTrainModelLambda',
      {
        lambdaFunctionProps: props.trainModelLambdaProps,
        existingBucketObj: props.brainS3Bucket,
        s3EventSourceProps: {
          events: [EventType.OBJECT_CREATED_PUT],
          filters: [{ prefix: 'knowledge', suffix: 'json' }],
        },
      }
    );

    /** Grane TrainModel Lambda permissions on Brain Bucket */
    brainS3ToTrainModelLambda.lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`${props.brainS3Bucket?.bucketArn}/*`],
        actions: ['s3:GetObject', 's3:PutObject'],
      })
    );
    this._trainModelLambda = brainS3ToTrainModelLambda.lambdaFunction;
  }

  public get trainModelLambda(): Function {
    return this._trainModelLambda;
  }
}
