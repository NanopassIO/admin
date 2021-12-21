var AWS = require("aws-sdk")
const util = require('util')

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
const put = util.promisify(docClient.put).bind(docClient)
var table = 'prizes';


async function handle(data) {
  await put({
    TableName: table,
    Item: {
      batch: data.batch,
      name: data.name,
      count: 0
    }
  })
}

exports.handler = (event, _, callback) => {
  const json = JSON.parse(event.body)  
  if(json.password !== process.env.PASSWORD) {
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