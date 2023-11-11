import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "rss-OAI")

    const siteBucket = new s3.Bucket(this, "rss-StaticBucket", {
      bucketName: "rss-cloudfront-s3",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    })

    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ["S3:GetObject"],
      resources: [siteBucket.arnForObjects("*")],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }))

    const distribution = new cloudfront.CloudFrontWebDistribution(this, "rss-distribution", {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: siteBucket,
          originAccessIdentity: cloudfrontOAI
        },
        behaviors: [{
          isDefaultBehavior: true
        }]
      }]
    })

    new s3deploy.BucketDeployment(this, "rss-Bucket-Deployment", {
      sources: [s3deploy.Source.asset("../dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"]
    })
  }
}
