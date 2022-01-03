var AWS = require("aws-sdk")
const util = require('util')

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();

async function handle() {
  try {
    const scan = util.promisify(docClient.scan).bind(docClient)
    const result = await scan({
      TableName : 'accounts'
    })
    return result
  } catch(e) {
    console.log(e.message)
  }

  return
}

exports.handler = (event, context, callback) => {
  const json = JSON.parse(event.body)  
  if(json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle(json.data).then(response => {
    return callback(null, { statusCode: 200, body: JSON.stringify(response) })
  }).catch(error => {
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}