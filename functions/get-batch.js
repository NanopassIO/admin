var AWS = require("aws-sdk")
const util = require('util')

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
var table = 'batches';

async function handle(data) {
  var params = {
    TableName : table,
    ExpressionAttributeNames:{
        "#b": "batch"
    },
    ExpressionAttributeValues: {
        ":batch": data.batch
    },
    KeyConditionExpression: "#b = :batch"
  };
  console.log(params)

  try {
    const query = util.promisify(docClient.query).bind(docClient)
    const result = await query(params);
//    console.log(result)
    return result
  } catch(e) {
    console.log(e.message)
  }

  return
}

exports.handler = (event, context, callback) => {
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