import AWS from 'aws-sdk';
import util from 'util';
import { HandlerEvent, HandlerContext, HandlerCallback } from '@netlify/functions';

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

var docClient = new AWS.DynamoDB.DocumentClient();
const scan = util.promisify(docClient.scan).bind(docClient);

async function handle() {
  try {
    const settingsItems = await scan({
      TableName: 'settings',
      Limit: 1,
    });

    const settings = settingsItems.Items[0];
    return settings;
  } catch (e) {
    console.log(e.message);
  }

  return;
}

export const handler = (event: HandlerEvent, context: HandlerContext, callback: HandlerCallback) => {
  handle()
    .then((response) => {
      return callback(null, { statusCode: 200, body: JSON.stringify(response) });
    })
    .catch((error) => {
      return callback(null, { statusCode: 500, body: JSON.stringify(error) });
    });
};
