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
const query = util.promisify(docClient.query).bind(docClient)

async function handle() {
  try {
    const config = await query({
      TableName: 'slotGameConfiguration',
      KeyConditionExpression: 'configType = :val',
      ExpressionAttributeValues: {
        ':val': 'WINNING_PROBABILITY'
      }
    })
    const winningProbabilityConfig = JSON.parse(config.Items[0].configValue)

    return winningProbabilityConfig
  } catch (e) {
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  handle()
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
