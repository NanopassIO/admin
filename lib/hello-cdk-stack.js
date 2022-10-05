const cdk = require('aws-cdk-lib')
const lambda = require('aws-cdk-lib/aws-lambda')
const apigw = require('aws-cdk-lib/aws-apigateway')
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs')
const path = require('path')
require('dotenv').config()

class HelloCdkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props)
    const lambdaApi = (fileNames) => {
      for (let fileName of fileNames) {
        const lambdaHandler = new NodejsFunction(this, fileName, {
          memorySize: 1024,
          timeout: cdk.Duration.seconds(5),
          runtime: lambda.Runtime.NODEJS_14_X, // execution environment
          handler: 'handler',
          entry: path.join(__dirname, `/../lambda/${fileName}.ts`),
          bundling: {
            minify: true,
            externalModules: ['aws-sdk', 'aws-lambda']
          },
          environment: {
            PASSWORD: process.env.PASSWORD,
            REGION: process.env.REGION
          }
        })
        new apigw.LambdaRestApi(this, `${fileName}RestApi`, {
          handler: lambdaHandler
        })
      }
    }

    lambdaApi(['add-game-prize', 'testing-give-balance'])
  }
}

module.exports = { HelloCdkStack }
