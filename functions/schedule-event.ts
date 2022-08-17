import AWS from 'aws-sdk'
import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import { v4 as uuidv4 } from 'uuid'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const ruleName = 'Testing'
const handle = async (data) => {
  const eventbridge = new AWS.EventBridge()
  const lambda = new AWS.Lambda()
  const eventParams = {
    Name: ruleName /* required */,
    Description: 'Testing',
    ScheduleExpression: 'cron(34 00 17 8 ? 2022)',
    State: 'ENABLED'
  }
  const rule = await eventbridge.putRule(eventParams).promise()
  const inputObj = {
    a: 'Fire',
    b: 'Water'
  }
  const targetParams = {
    Rule: ruleName /* required */,
    Targets: [
      /* required */
      {
        Arn: 'arn:aws:lambda:us-east-1:077099800493:function:TestingFunction' /* required */,
        Id: 'testingRuleTarget' /* required */,
        Input: JSON.stringify(inputObj),
        RetryPolicy: {
          MaximumEventAgeInSeconds: 3600,
          MaximumRetryAttempts: 5
        }
      }
    ]
  }
  await eventbridge.putTargets(targetParams).promise()
  return await lambda
    .addPermission({
      Action: 'lambda:InvokeFunction',
      FunctionName: 'TestingFunction',
      StatementId: uuidv4(),
      Principal: 'events.amazonaws.com',
      SourceArn: rule.RuleArn
    })
    .promise()
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  const json = JSON.parse(event.body || '')
  handle(json.data)
    .then((response) => {
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify(response)
      })
    })
    .catch((error) => {
      return callback(null, { statusCode: 500, body: JSON.stringify(error) })
    })
}
