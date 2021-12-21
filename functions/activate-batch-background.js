var AWS = require("aws-sdk")
const { ethers } = require('ethers')
const ABI = require('./abi.json')
const util = require('util')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
const provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
const query = util.promisify(docClient.query).bind(docClient)
const put = util.promisify(docClient.put).bind(docClient)
var table = 'batches';

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function handle(data) {
  // Get existing address list
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
  let result = await query(params);
  const existingAddresses = result.Items

  // Fetch new list
  const maxSupply = 5555
  const portions = 250
  let postReveal = []
  for(let i = 0;i < maxSupply;i+=portions) {
    const section = Array.from(Array(portions), (_,x)=>i+x).filter(x => x < maxSupply)
    console.log(`Fetching ${i} to ${i + portions}`)
    postReveal = postReveal.concat(await Promise.all(section.map(async x => {
      return await contract.ownerOf(x)
    })))
  }

  let postRH = {}
  for(const address of postReveal) {
    postRH[address] = postRH[address] ? postRH[address] + 1 : 1
  }

  // Compare lists
  const min = (x,y) => x > y ? y : x

  let flatAddresses = []
  for(const address of existingAddresses) {
    const count = min(address.balance ?? 0, postRH[address.address] ?? 0)
    for(let i = 0;i < count;i++) {
      flatAddresses.push(address.address)
    }
  }

  // Fetch list of prizes
  params = {
    TableName : 'prizes',
    ExpressionAttributeNames:{
        "#b": "batch"
    },
    ExpressionAttributeValues: {
        ":batch": data.batch
    },
    KeyConditionExpression: "#b = :batch"
  };
  result = await query(params);
  let prizesDb = result.Items
  let prizes = []
  for(const prizeDb of prizesDb) {
    const prizeCount = parseInt(prizeDb.count)
    for(let i = 0;i < prizeCount;i++) {
      prizes.push(prizeDb)
    }
  }

  // Shuffle addresses list
  let shuffledAddresses = shuffle(flatAddresses)

  // Slice list for extra addresses
  shuffledAddresses = shuffledAddresses.slice(0, prizes.length)

  // Assign prizes based on addresses list shuffle
  let prizeAssignment = {}
  for(let i = 0;i < shuffledAddresses.length;i++) {
    prizeAssignment[shuffledAddresses[i]] = 
      [...(prizeAssignment[shuffledAddresses[i]] ? prizeAssignment[shuffledAddresses[i]] : []), prizes[i].name]
  }

  // Push array of prizes
  const keyCount = existingAddresses.length
  for(let i = 0;i < keyCount;i+=portions) {
    await Promise.all(existingAddresses.slice(i, i+portions).map(async x => {
      if(prizeAssignment[x.address]) {
        var params = {
          TableName: table,
          Item: {
            batch: data.batch,
            address: x.address,
            balance: prizeAssignment[x.address].length,
            prizes: prizeAssignment[x.address].join(',')
          }
        }
        
        await put(params)
        console.log(params)
      }
    }))

//    console.log(`Pushing ${i} to ${i + portions}`)
  }


  // Set batch as active
  var params = {
    TableName: 'settings',
    Item: {
      active: data.batch
    }
  }
  
  await put(params)
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
    console.log(error)
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}