import AWS from 'aws-sdk'
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

const scanTable = async (params) => {
  const scanResults: any[] = []
  let items
  do {
    items = await docClient.scan(params).promise()
    items.Items.forEach((item) => scanResults.push(item))
    params.ExclusiveStartKey = items.LastEvaluatedKey
  } while (typeof items.LastEvaluatedKey !== 'undefined')

  return scanResults
}

async function handle(data: any) {
  try {
    if (data?.name) {
      const result = await scanTable({
        TableName: 'purchases',
        FilterExpression: 'itemName = :val',
        ExpressionAttributeValues: {
          ':val': data.name
        }
      })
      return result
    }
    const result = await scanTable({
      TableName: 'purchases'
    })
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
