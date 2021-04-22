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

import {
  Aws,
  Construct,
  CustomResource,
  CfnCondition,
  Duration,
} from '@aws-cdk/core';
import { Runtime, Code, CfnFunction } from '@aws-cdk/aws-lambda';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { CfnNagHelper } from './cfn-nag-helper';

export interface SolutionHelperProps {
  readonly solutionId: string;
  readonly solutionVersion: string;
  readonly sendAnonymousDataCondition: CfnCondition;
  readonly botName: string;
  readonly botGender: string;
  readonly botLanguage: string;
}

export class SolutionHelper extends Construct {
  private readonly _createIdFunction: CustomResource;

  constructor(scope: Construct, id: string, props: SolutionHelperProps) {
    super(scope, id);

    const helperFunction = buildLambdaFunction(this, {
      lambdaFunctionProps: {
        runtime: Runtime.PYTHON_3_8,
        handler: 'lambda_function.handler',
        description:
          'This function generates UUID for each deployment and sends anonymous data to the AWS Solutions team',
        code: Code.fromAsset('../services/solution-helper'),
        timeout: Duration.seconds(30),
      },
    });

    this._createIdFunction = new CustomResource(this, 'CreateUniqueID', {
      serviceToken: helperFunction.functionArn,
      properties: {
        Resource: 'UUID',
      },
      resourceType: 'Custom::CreateUUID',
    });

    const sendDataFunction = new CustomResource(this, 'SendAnonymousData', {
      serviceToken: helperFunction.functionArn,
      properties: {
        Resource: 'AnonymousMetric',
        SolutionId: props.solutionId,
        UUID: this._createIdFunction.getAttString('UUID'),
        Region: Aws.REGION,
        Version: props.solutionVersion,
        botName: props.botName,
        botGender: props.botGender,
        botLanguage: props.botLanguage,
      },
      resourceType: 'Custom::AnonymousData',
    });

    /** Suppression for cfn nag W92 */
    const cfnFunction = helperFunction.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
    });
    /** Add the metricsCondition to the resources */
    (helperFunction.node.defaultChild as CfnFunction).cfnOptions.condition =
      props.sendAnonymousDataCondition;
    (this._createIdFunction.node
      .defaultChild as CfnFunction).cfnOptions.condition =
      props.sendAnonymousDataCondition;
    (sendDataFunction.node.defaultChild as CfnFunction).cfnOptions.condition =
      props.sendAnonymousDataCondition;

  }

  public get createIdFunction(): CustomResource {
    return this._createIdFunction;
  }
}
