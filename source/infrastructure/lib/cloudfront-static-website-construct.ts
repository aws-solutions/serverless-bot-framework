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
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class CloudfrontStaticWebsite extends Construct {
  private readonly _webclient: Bucket | undefined;
  private readonly _domainName: string;
  private readonly _bucketName: any;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cloudfrontToS3 = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
    });

    this._webclient = cloudfrontToS3.s3Bucket;
    this._domainName = `https://${cloudfrontToS3.cloudFrontWebDistribution.domainName}`;
    this._bucketName = cloudfrontToS3.s3Bucket?.bucketName;
  }

  public get webclient(): Bucket | undefined {
    return this._webclient;
  }

  public get domainName(): string {
    return this._domainName;
  }

  public get bucketName(): string {
    return this._bucketName.toString();
  }
}
