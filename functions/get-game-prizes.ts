import AWS from 'aws-sdk'
import util from 'util'
import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import { DynamoDB } from '../src/db'

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const docClient = new AWS.DynamoDB.DocumentClient()
const scan = util.promisify(docClient.scan).bind(docClient)

const calculateWinningBid = async (bidsObj) => {
  let winnerBidComparisonNum = 9999999
  for (const i in bidsObj) {
    if (bidsObj[i].length < 1) continue
    const comparisonNum = parseFloat(`${bidsObj[i].length}.${i}1`)

    if (comparisonNum < winnerBidComparisonNum) {
      const comparisonNumStr = comparisonNum.toString()
      const winnerBidComparisonNumStr = winnerBidComparisonNum.toString()
      if (
        parseInt(comparisonNumStr) < parseInt(winnerBidComparisonNumStr) ||
        comparisonNumStr.length <= winnerBidComparisonNumStr.length
      ) {
        winnerBidComparisonNum = comparisonNum
      }
    }
  }

  const winningBid = winnerBidComparisonNum
    .toString()
    .split('.')[1]
    .slice(0, -1)

  return winningBid
}

async function handle(data: any, db?: DynamoDB) {
  try {
    const gamePrizes = await scan({
      TableName: 'gameprize'
    })

    const activePrize = gamePrizes.Items.filter(
      (prize) => prize.batchNo === data.batch
    )

    if (activePrize.length < 1) return gamePrizes.Items

    const result = await scan({
      TableName: 'bids',
      FilterExpression: 'prizeToBidFor = :val',
      ExpressionAttributeValues: {
        ':val': activePrize[0].name
      }
    })

    const currentTotalBids = result.Items.length

    if (currentTotalBids < 1) return gamePrizes.Items

    const bidsObj = {}
    result.Items.forEach((i) => {
      if (bidsObj[i.bid]) {
        bidsObj[i.bid].push(i)
      } else {
        bidsObj[i.bid] = [i]
      }
    })

    const currentWinningBid = await calculateWinningBid(bidsObj)

    const gamePrizesResult = gamePrizes.Items.map((prize) => {
      if (prize.batchNo === data.batch) {
        return { ...prize, currentTotalBids, currentWinningBid }
      }
      return prize
    })

    return gamePrizesResult
  } catch (e) {
    console.log(e.message)
  }
}

export const handler = (
  event: HandlerEvent,
  context: HandlerContext,
  callback: HandlerCallback
) => {
  const json = JSON.parse(event.body)
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
