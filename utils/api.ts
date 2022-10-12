import { HandlerEvent, HandlerCallback } from '@netlify/functions'

interface ApiItem {
  requestPayload?: any
  responseHeaders?: Record<string, string>
}

export const apiHandler = (
  event: HandlerEvent,
  decorators: any[],
  callback: HandlerCallback,
  action
) => {
  const json = JSON.parse(event.body || '')
  const apiItem: ApiItem = { requestPayload: json }
  for (const decorator of decorators) {
    const result = decorator(apiItem, callback)
    // If there is callback returned from decorator, then return directly
    if (result) {
      return result
    }
  }

  action(json)
    .then((response) => {
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: apiItem.responseHeaders
      })
    })
    .catch((error) => {
      return callback(null, {
        statusCode: 500,
        body: JSON.stringify(error)
      })
    })
}

export const authDecorator = (apiItem: ApiItem, callback: HandlerCallback) => {
  const json = apiItem.requestPayload
  if (json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }
}

export const allowAllOriginDecorator = (apiItem: ApiItem) => {
  apiItem.responseHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  }
}
