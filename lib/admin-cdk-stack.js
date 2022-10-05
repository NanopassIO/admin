const cdk = require('aws-cdk-lib')
const lambda = require('aws-cdk-lib/aws-lambda')
const apigw = require('aws-cdk-lib/aws-apigateway')
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs')
const path = require('path')
const { Handler } = require('aws-cdk-lib/aws-lambda')
const { LambdaIntegration } = require('aws-cdk-lib/aws-apigateway')
require('dotenv').config()

class AdminCdkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props)
    const functionProps = (fileName) => {
      return {
        memorySize: 1024,
        timeout: cdk.Duration.seconds(15),
        runtime: lambda.Runtime.NODEJS_14_X, // execution environment
        entry: path.join(__dirname, `/../lambda/${fileName}.ts`),
        bundling: {
          minify: true,
          externalModules: ['aws-sdk', 'aws-lambda']
        },
        environment: {
          PASSWORD: process.env.PASSWORD,
          REGION: process.env.REGION
        }
      }
    }
    const addGamePrizeHandler = new NodejsFunction(
      this,
      'add-game-prize',
      functionProps('add-game-prize')
    )
    const testGiveBalanceHandler = new NodejsFunction(
      this,
      'testing-give-balance',
      functionProps('testing-give-balance')
    )

    const addGamePrizeIntegration = new LambdaIntegration(addGamePrizeHandler)
    const testGiveBalanceIntegration = new LambdaIntegration(
      testGiveBalanceHandler
    )

    const api = new apigw.RestApi(this, `testing`, {
      restApiName: 'Testing'
    })

    const items = api.root.addResource('add-game-prize')
    items.addMethod('POST', addGamePrizeIntegration)

    const items2 = api.root.addResource('test-give-balance')
    items2.addMethod('POST', testGiveBalanceIntegration)
  }
}

module.exports = { AdminCdkStack }
