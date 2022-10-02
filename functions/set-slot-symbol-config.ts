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
    const slotSymbolConfig = JSON.parse(event.body)['slotSymbolConfig']
    validateConfig(slotSymbolConfig)
    await update({
      TableName: 'slotGameConfiguration',
      Key: {
        configType: 'SLOT_SYMBOLS_CONFIG'
      },
      UpdateExpression: 'set configValue = :val',
      ExpressionAttributeValues: {
        ':val': JSON.stringify(slotSymbolConfig)
      }
    })
  } catch (e) {
    console.log(e)
    throw e
  }
}

/**
 * Validate the structure of the config to prevent dirty data
 * @param slotSymbolConfig
 */
const validateConfig = (slotSymbolConfig) => {
  // Config validation
  for (const config of slotSymbolConfig) {
    if (
      !(
        config &&
        config.hasOwnProperty('id') &&
        config.hasOwnProperty('payout') &&
        config.hasOwnProperty('weight')
      )
    ) {
      throw {
        errorMessage: 'The structure of the config is wrong'
      }
    }

    if (parseInt(config['id'], 10) < 0 || parseInt(config['id'], 10) > 15) {
      throw {
        errorMessage: `symbol id: ${config['id']} is invalid. The supported symbols should be in the range of [0,15]`
      }
    }

    if (isNaN(config['weight'])) {
      throw {
        errorMessage: 'Weightage should be number'
      }
    }

    if (!Number.isInteger(config['payout'])) {
      throw {
        errorMessage: 'Payout should be integer'
      }
    }
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

  handle(event)
    .then((response) => {
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({})
      })
    })
    .catch((error) => {
      return callback(null, {
        statusCode: 500,
        body: JSON.stringify(error)
      })
    })
}
