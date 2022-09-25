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
    validateConfig(winningProbabilityConfig)
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
    throw e
  }
}

/**
 * Validate the structure of the config to prevent dirty data
 * @param winningProbabilityConfig 
 */
const validateConfig = (winningProbabilityConfig) => {
  // Config validation
  for (const config of winningProbabilityConfig) {
    if (
      !(
        config &&
        config.hasOwnProperty('id') &&
        config.hasOwnProperty('weight')
      )
    ) {
      throw {
        errorMessage: 'The structure of the config is wrong'
      }
    }

    if (parseInt(config['id'], 10) > 5) {
      throw {
        errorMessage: 'Number of winning lines should not be more than 5'
      }
    }

    if (isNaN(config['weight'])) {
      throw {
        errorMessage: 'Weightage should be number'
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
