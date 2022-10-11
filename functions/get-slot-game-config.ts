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

async function handle() {
  try {
    const config = await scan({
      TableName: 'slotGameConfiguration'
    })
    return {
      winningLineProbability: JSON.parse(
        config.Items.filter((o) => o.configType === 'WINNING_PROBABILITY').map(
          (o) => o.configValue
        )
      ),
      symbolConfig: JSON.parse(
        config.Items.filter((o) => o.configType === 'SLOT_SYMBOLS_CONFIG').map(
          (o) => o.configValue
        )
      )
    }
  } catch (e) {
    console.log(e)
    throw e
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
