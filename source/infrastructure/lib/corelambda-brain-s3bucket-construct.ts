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
import { Bucket } from '@aws-cdk/aws-s3';
import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Policy, CfnPolicy } from '@aws-cdk/aws-iam';
import { LambdaToS3 } from '@aws-solutions-constructs/aws-lambda-s3';

export interface CoreLambdaToBrainS3Props {
  readonly existingLambdaObj?: Function;
  readonly lambdaFunctionProps?: FunctionProps;
}

export class CoreLambdaToBrainS3 extends Construct {
  private readonly _coreLambda: Function;
  private readonly _brainS3Bucket: Bucket | undefined;
  private readonly _bucketName: any;

  constructor(scope: Construct, id: string, props: CoreLambdaToBrainS3Props) {
    super(scope, id);

    const coreLambdaBrainS3Bucket = new LambdaToS3(
      this,
      'CoreLambdaBrainS3Bucket',
      {
        existingLambdaObj: props.existingLambdaObj,
        lambdaFunctionProps: props.lambdaFunctionProps,
      }
    );

    const pollyPolicy = new Policy(this, 'PollyPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['polly:SynthesizeSpeech'],
          resources: ['*'],
        }),
      ],
    });
    
    /** Add policy metadata to explain why resources: ['*'] is needed and why the permissions are complex */
    (pollyPolicy.node.defaultChild as CfnPolicy).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W12',
            reason:
              'Polly allows specifying lexicon ARNs only. There is no specific lexicon required for this policy',
          }
        ],
      },
    };

    /** Grant CoreLambda Polly permissions */
    coreLambdaBrainS3Bucket.lambdaFunction.role?.attachInlinePolicy(pollyPolicy);
    /** Get the CoreLambda created by the LambdaToS3 construct */
    this._coreLambda = coreLambdaBrainS3Bucket.lambdaFunction;

    /** Get the BrainS3Bucket created by the LambdaToS3 construct */
    this._brainS3Bucket = coreLambdaBrainS3Bucket.s3Bucket;
    this._bucketName = coreLambdaBrainS3Bucket.s3Bucket?.bucketName;

    /** Change the CoreLambda's bucket environment's name  */
    this._coreLambda.addEnvironment('bucketName', this._bucketName);
  }

  public get coreLambda(): Function {
    return this._coreLambda;
  }

  public get brainS3Bucket(): Bucket | undefined {
    return this._brainS3Bucket;
  }

  public get bucketName(): string {
    return this._bucketName.toString();
  }
}
