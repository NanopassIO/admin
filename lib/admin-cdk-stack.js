const cdk = require('aws-cdk-lib')
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
      const items = api.root.addResource(fileName)
      items.addMethod('POST', integration)
    }
  }

  constructor(scope, id, props) {
    super(scope, id, props)

    const api = new apigw.RestApi(this, `admin`, {
      restApiName: 'admin'
    })

    const lambdaFiles = fs.readdirSync(path.join(__dirname, `${LAMBDA_DIR}`))
    const formattedLambdaFileNames = lambdaFiles.map((o) =>
      o.replace('.ts', '')
    )
    this.lambdaApi(api, formattedLambdaFileNames)
  }
}

module.exports = { AdminCdkStack }
