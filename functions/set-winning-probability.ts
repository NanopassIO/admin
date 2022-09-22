import AWS from 'aws-sdk'
import util from 'util'
import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const docClient = new AWS.DynamoDB.DocumentClient()
const update = util.promisify(docClient.update).bind(docClient)

async function handle(event) {
  try {
    const winningProbabilityConfig = JSON.parse(event.body)[
      'winningProbabilityConfig'
    ]
    await update({
      TableName: 'slotGameConfiguration',
      Key: {
        configType: 'WINNING_PROBABILITY'
      },
      UpdateExpression: 'set configValue = :val',
      ExpressionAttributeValues: {
        ':val': JSON.stringify(winningProbabilityConfig)
      }
    })
  } catch (e) {
    console.log(e)
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  handle(event)
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
