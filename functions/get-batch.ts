import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import { allowAllOriginDecorator, apiHandler, authDecorator } from 'utils/api'
import { DynamoDB } from '../src/db'

const db = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

async function handle(data) {
  try {
    return await db.query('batches', 'batch', data.batch)
  } catch (e) {
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  return apiHandler(
    event,
    [allowAllOriginDecorator, authDecorator],
    callback,
    handle
  )
}
