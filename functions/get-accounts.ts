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
const scan = util.promisify(docClient.scan).bind(docClient)

async function handle(data) {
  try {
    const scanConfig: { [k: string]: any } = {
      TableName: 'accounts',
      Limit: 1000,
    }
    if (data?.attributes) scanConfig.ProjectionExpression = data.attributes
    if (data?.ExclusiveStartKey) scanConfig.ExclusiveStartKey = data.ExclusiveStartKey

    const result = await scan(scanConfig)
    return result
  } catch (e) {
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  const json = JSON.parse(event.body || '')
  if (json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

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
