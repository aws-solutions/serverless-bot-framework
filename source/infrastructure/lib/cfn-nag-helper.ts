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
import { CfnResource } from '@aws-cdk/core';

export interface CfnNagSuppression {
  Id: string;
  Reason: string;
}

export class CfnNagHelper {
  public static addSuppressions(resource: CfnResource, suppressions: CfnNagSuppression | CfnNagSuppression[]) {

    let rules = [];

    if (suppressions instanceof Array) {
      for (const suppression of suppressions) {
        rules.push({ id: suppression.Id, reason: suppression.Reason });
      }
    } else {
      rules.push({ id: suppressions.Id, reason: suppressions.Reason });
    }

    const existingRules = resource.cfnOptions.metadata?.cfn_nag?.rules_to_suppress;
    resource.cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: existingRules ? [...existingRules, ...rules] : rules
      }
    };
  }
}