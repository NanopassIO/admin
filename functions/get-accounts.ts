import AWS from 'aws-sdk';
import { ScanInput } from 'aws-sdk/clients/dynamodb';
import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();

const scanTable = async (params:ScanInput) => {
  const scanResults: any[] = [];
  let items;
  do{
      items =  await docClient.scan(params).promise();
      items && items.Items ? items.Items.forEach((item) => scanResults.push(item)) : null;
      params.ExclusiveStartKey  = items.LastEvaluatedKey;
  } while(typeof items.LastEvaluatedKey !== "undefined");

  return scanResults;
};

async function handle() {
  try {
    const result = await scanTable({
      TableName : 'accounts'
    })
    return result
  } catch(e:any) {
    console.log(e.message)
  }

  return
}

const handler: Handler = (event: HandlerEvent, context: HandlerContext, callback: Function) => {
  const json = JSON.parse(event.body)
  if(json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle().then(response => {
    return callback(null, { statusCode: 200, body: JSON.stringify(response) })
  }).catch(error => {
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}

export {handler};