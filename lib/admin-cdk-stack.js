const cdk = require('aws-cdk-lib')
const s3 = require('aws-cdk-lib/aws-s3')
const s3deploy = require('aws-cdk-lib/aws-s3-deployment')
const cloudFront = require('aws-cdk-lib/aws-cloudfront')
const lambda = require('aws-cdk-lib/aws-lambda')
const apigw = require('aws-cdk-lib/aws-apigateway')
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs')
const path = require('path')
const fs = require('fs')
const { LambdaIntegration } = require('aws-cdk-lib/aws-apigateway')
require('dotenv').config()

const LAMBDA_DIR = '/../functions/'

class AdminCdkStack extends cdk.Stack {
  lambdaApi = (api, fileNames) => {
    for (let fileName of fileNames) {
      const handler = new NodejsFunction(this, fileName, {
        memorySize: 1024,
        timeout: cdk.Duration.seconds(15),
        runtime: lambda.Runtime.NODEJS_14_X, // execution environment
        entry: path.join(__dirname, `${LAMBDA_DIR}${fileName}.ts`),
        bundling: {
          minify: true,
          externalModules: ['aws-sdk', 'aws-lambda']
        },
        environment: {
          PASSWORD: process.env.PASSWORD,
          REGION: process.env.REGION,
          ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
          SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY
        }
      })
      const integration = new LambdaIntegration(handler)
      const items = api.root
        .addResource(`.netlify`)
        .addResource(`functions`)
        .addResource(`${fileName}`)
      items.addMethod('POST', integration)
    }
  }

  constructor(scope, id, props) {
    super(scope, id, props)

    // Add S3 Bucket
    const s3Site = new s3.Bucket(this, `<MyReactApp>`, {
      bucketName: `admin-frontend-bucket-5`,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html'
    })
    this.enableCorsOnBucket(s3Site)

    const api = new apigw.RestApi(this, `admin`, {
      restApiName: 'admin',
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key'
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: apigw.Cors.ALL_ORIGINS
      }
    })

    const lambdaFiles = fs.readdirSync(path.join(__dirname, `${LAMBDA_DIR}`))
    const formattedLambdaFileNames = lambdaFiles.map((o) =>
      o.replace('.ts', '')
    )
    // this.lambdaApi(api, formattedLambdaFileNames)
    this.lambdaApi(api, ['get-accounts'])

    // Create a new CloudFront Distribution
    const distribution = new cloudFront.CloudFrontWebDistribution(
      this,
      `admin-cf-distribution`,
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: s3Site
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
                allowedMethods: cloudFront.CloudFrontAllowedMethods.ALL,
                cachedMethods:
                  cloudFront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                forwardedValues: {
                  queryString: true,
                  cookies: {
                    forward: 'none'
                  },
                  headers: [
                    'Access-Control-Request-Headers',
                    'Access-Control-Request-Method',
                    'Origin'
                  ]
                }
              }
            ]
          },
          {
            customOriginSource: {
              domainName: `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`
            },
            originPath: `/${api.deploymentStage.stageName}`,
            behaviors: [
              {
                pathPattern: '/.netlify/*',
                allowedMethods: cloudFront.CloudFrontAllowedMethods.ALL
              }
            ]
          }
        ],
        comment: `myreactapp - CloudFront Distribution`,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    )

    // Setup Bucket Deployment to automatically deploy new assets and invalidate cache
    new s3deploy.BucketDeployment(this, `admin-s3bucketdeployment`, {
      sources: [s3deploy.Source.asset(path.join(__dirname, `/../public`))],
      destinationBucket: s3Site,
      distribution: distribution,
      distributionPaths: ['/*']
    })

    // Final CloudFront URL
    new cdk.CfnOutput(this, 'CloudFront URL', {
      value: distribution.domainName
    })
  }

  /**
   * Enables CORS access on the given bucket
   *
   * @memberof CxpInfrastructureStack
   */
  enableCorsOnBucket = (bucket) => {
    const cfnBucket = bucket.node.findChild('Resource')
    cfnBucket.addPropertyOverride('CorsConfiguration', {
      CorsRules: [
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['HEAD', 'GET', 'PUT', 'POST', 'DELETE'],
          ExposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2'
          ],
          AllowedHeaders: ['*']
        }
      ]
    })
  }
}

module.exports = { AdminCdkStack }
