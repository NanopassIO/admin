import AWS from "aws-sdk"
import util from 'util'
import { Handler, HandlerEvent, HandlerContext, HandlerCallback, HandlerResponse } from "@netlify/functions"

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
const put = util.promisify(docClient.put).bind(docClient)

async function handle(data: { [key: string]: any }) {
  try {
    // Set batch as active
    var params = {
      TableName: 'settings',
      Item: {
        active: 'active',
        batch: data.batch
      }
    }
    await put(params)
  } catch(e: any) {
    console.log(e.message)
    throw e
  }
}

const handler = (event: HandlerEvent, _: HandlerContext, callback: HandlerCallback) => {
  const json = JSON.parse(event.body || '{}')
  if(json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle(json.data).then(response => {
    return callback(null, { statusCode: 200, body: JSON.stringify(response) })
  }).catch(error => {
    console.log(error)
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}

export { handler }

