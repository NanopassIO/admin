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
const put = util.promisify(docClient.put).bind(docClient)

async function handle(data) {
  try {
    // Set batch as active
    const params = {
      TableName: 'settings',
      Item: {
        active: 'active',
        batch: data.batch
      }
    }
    await put(params)
  } catch (e) {
    console.log(e.message)
    throw e
  }
}

export const handler = (
  event: HandlerEvent,
  _: HandlerContext,
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
      console.log(error)
      return callback(null, { statusCode: 500, body: JSON.stringify(error) })
    })
}
