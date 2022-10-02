import AWS from 'aws-sdk'
import util from 'util'
import crypto from 'crypto'

const calculateWinner = async (bidsObj) => {
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

  const winnerBid = winnerBidComparisonNum.toString().split('.')[1].slice(0, -1)
  const playersWithWinningBid = bidsObj[winnerBid]
  let winner = playersWithWinningBid[0]

  if (playersWithWinningBid.length > 1) {
    winner =
      playersWithWinningBid[crypto.randomInt(playersWithWinningBid.length)]
  }

  return winner
}

export async function handle() {
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

  const settingsItems = await scan({
    TableName: 'settings',
    Limit: 1
  })
  console.log(settingsItems)
  const settings = settingsItems.Items[0]
  const batch = settings.batch

  console.log('Current Batch: ', batch)

  const currGame = (
    await scan({
      TableName: 'gameprize',
      FilterExpression: 'batchNo = :batch',
      ExpressionAttributeValues: {
        ':batch': batch
      }
    })
  ).Items[0]

  console.log('Current GAME: ', currGame)

  const result = await scan({
    TableName: 'bids',
    FilterExpression: 'prizeToBidFor = :val',
    ExpressionAttributeValues: {
      ':val': currGame.name
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

  console.log('Verified Winner', verifiedWinner)

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

      let fragsToDeduct = currPlayerBid < winnerBid ? currPlayerBid : winnerBid

      if (currPlayerFrags < fragsToDeduct) {
        fragsToDeduct = currPlayerFrags
      }

      const updatedAccount = (
        await update({
          TableName: 'accounts',
          Key: {
            address: result.Items[i].address
          },
          UpdateExpression: 'set fragments = fragments - :val',
          ConditionExpression: 'fragments >= :val',
          ExpressionAttributeValues: {
            ':val': fragsToDeduct
          },
          ReturnValues: 'ALL_NEW'
        })
      ).Attributes

      console.log(
        `Deducted ${fragsToDeduct} frags from ${updatedAccount.address}. His bid was ${currPlayerBid}`
      )

      await put({
        TableName: 'logs',
        Item: {
          address: updatedAccount.address,
          activity: 'Stewpid Bids',
          oldFrags: currPlayerFrags,
          newFrags: updatedAccount.fragments,
          timestamp: Date.now()
        }
      })
    } catch (e) {
      console.log('Error', e)
      continue
    }
  }

  console.log('Updating game prize winner')
  // update game winner & get game prize
  const gamePrize = (
    await update({
      TableName: 'gameprize',
      Key: {
        name: currGame.name
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
  console.log('Updated game prize', gamePrize)

  console.log('Updating winner Inventory')
  // update winner's inventory with game prize
  const inventory = JSON.parse(verifiedWinnerAcc.inventory)
  inventory.push(gamePrize)
  verifiedWinnerAcc.inventory = JSON.stringify(inventory)

  await put({
    TableName: 'accounts',
    Item: verifiedWinnerAcc
  })

  console.log('Winner: ', verifiedWinner)
  return verifiedWinner
}

export const lambda = async () => {
  try {
    const response = await handle()
    return { statusCode: 200, body: JSON.stringify(response) }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}
