import AWS from 'aws-sdk'
import util from 'util'
import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import crypto from 'crypto'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const docClient = new AWS.DynamoDB.DocumentClient()
const scan = util.promisify(docClient.scan).bind(docClient)
const query = util.promisify(docClient.query).bind(docClient)
const update = util.promisify(docClient.update).bind(docClient)

const calculateWinner = async (bidsObj) => {
  let winnerBidComparisonNum = 9999
  for (const i in bidsObj) {
    if (bidsObj[i].length < 1) continue
    const comparisonNum = parseFloat(`${bidsObj[i].length}.${i}1`)
    if (comparisonNum < winnerBidComparisonNum)
      winnerBidComparisonNum = comparisonNum
  }

  const winnerBid = winnerBidComparisonNum.toString().split('.')[1].slice(0, -1)
  let winner = bidsObj[winnerBid][0]

  if (winner.length > 1) {
    winner = winner[crypto.randomInt(winner.length)]
  }

  return winner
}

async function handle(data) {
  try {
    const result = await scan({
      TableName: 'bids',
      FilterExpression: 'prizeToBidFor = :val',
      ExpressionAttributeValues: {
        ':val': data.name
      }
    })

    const bidsObj = {}
    result.Items.forEach((i) => {
      if (bidsObj[i.bid]) {
        bidsObj[i.bid].push(i)
      } else {
        bidsObj[i.bid] = [i]
      }
    })

    let verifiedWinner

    do {
      const winner = await calculateWinner(bidsObj)
      const winnerAcc = (
        await query({
          TableName: 'accounts',
          KeyConditionExpression: 'address = :address',
          ExpressionAttributeValues: {
            ':address': winner.address
          }
        })
      ).Items[0]

      if (winnerAcc.fragments < winner.bid) {
        bidsObj[winner.bid] = bidsObj[winner.bid].filter(
          (player) => player.address !== winner.address
        )
      } else {
        verifiedWinner = winner
      }
    } while (!verifiedWinner)

    const winningBidInFragsCost = Math.floor(verifiedWinner.bid / 10)

    for (let i = 0; i < result.Items.length; i++) {
      try {
        const currPlayerBid = Math.floor(result.Items[i].bid / 10)

        // not handling case where player does not have enough frags
        await update({
          TableName: 'accounts',
          Key: {
            address: result.Items[i].address
          },
          UpdateExpression: 'set fragments = fragments - :val',
          ConditionExpression: 'fragments >= :val',
          ExpressionAttributeValues: {
            ':val':
              currPlayerBid < winningBidInFragsCost
                ? currPlayerBid
                : winningBidInFragsCost
          }
        })
      } catch (e) {
        continue
      }
    }

    // update game winner
    await update({
      TableName: 'gameprize',
      Key: {
        name: data.name
      },
      UpdateExpression:
        'set winnerAddress = :winnerAddress, winnerBid = :winnerBid',
      ExpressionAttributeValues: {
        ':winnerAddress': verifiedWinner.address,
        ':winnerBid': verifiedWinner.bid
      }
    })

    return verifiedWinner
  } catch (e) {
    console.log(e.message)
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

  handle(json.data)
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
