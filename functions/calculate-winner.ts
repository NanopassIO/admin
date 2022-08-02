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
const put = util.promisify(docClient.put).bind(docClient)

const calculateWinner = async (bidsObj) => {
  let winnerBidComparisonNum = 9999999
  for (const i in bidsObj) {
    if (bidsObj[i].length < 1) continue
    const comparisonNum = parseFloat(`${bidsObj[i].length}.${i}1`)

    if (
      comparisonNum.toString().length <
        winnerBidComparisonNum.toString().length ||
      (comparisonNum.toString().length ===
        winnerBidComparisonNum.toString().length &&
        comparisonNum < winnerBidComparisonNum)
    ) {
      winnerBidComparisonNum = comparisonNum
    }
  }

  const winnerBid = winnerBidComparisonNum.toString().split('.')[1].slice(0, -1)
  let winner = bidsObj[winnerBid][0]

  if (bidsObj[winnerBid].length > 1) {
    winner = bidsObj[winnerBid][crypto.randomInt(winner.length)]
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
    let verifiedWinnerAcc

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

      if (parseInt(winnerAcc.fragments) < parseInt(winner.bid)) {
        bidsObj[winner.bid] = bidsObj[winner.bid].filter(
          (player) => player.address !== winner.address
        )
      } else {
        verifiedWinner = winner
        verifiedWinnerAcc = winnerAcc
      }
    } while (!verifiedWinner)

    for (let i = 0; i < result.Items.length; i++) {
      try {
        const currAccount = (
          await query({
            TableName: 'accounts',
            KeyConditionExpression: 'address = :address',
            ExpressionAttributeValues: {
              ':address': result.Items[i].address
            }
          })
        ).Items[0]

        const currPlayerBid = parseInt(result.Items[i].bid)
        const winnerBid = parseInt(verifiedWinner.bid)
        const currPlayerFrags = parseInt(currAccount.fragments)

        let fragsToDeduct =
          currPlayerBid < winnerBid ? currPlayerBid : winnerBid

        if (currPlayerFrags < fragsToDeduct) {
          fragsToDeduct = currPlayerFrags
        }

        await update({
          TableName: 'accounts',
          Key: {
            address: result.Items[i].address
          },
          UpdateExpression: 'set fragments = fragments - :val',
          ConditionExpression: 'fragments >= :val',
          ExpressionAttributeValues: {
            ':val': currPlayerBid < winnerBid ? currPlayerBid : winnerBid
          }
        })
      } catch (e) {
        continue
      }
    }

    // update game winner & get game prize
    const gamePrize = (
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
        },
        ReturnValues: 'ALL_NEW'
      })
    ).Attributes

    // update winner's inventory with game prize
    const inventory = JSON.parse(verifiedWinnerAcc.inventory)
    inventory.push(gamePrize)
    verifiedWinnerAcc.inventory = JSON.stringify(inventory)

    await put({
      TableName: 'accounts',
      Item: verifiedWinnerAcc
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
