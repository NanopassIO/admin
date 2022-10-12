import AWS from 'aws-sdk'
import util from 'util'
import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import { allowAllOriginDecorator, apiHandler, authDecorator } from 'utils/api'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const docClient = new AWS.DynamoDB.DocumentClient()
const scan = util.promisify(docClient.scan).bind(docClient)

async function handle() {
  try {
    const settingsItems = await scan({
      TableName: 'settings',
      Limit: 1
    })

    const settings = settingsItems.Items[0]
    return settings
  } catch (e) {
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  return apiHandler(event, [allowAllOriginDecorator], callback, handle)
}
