const fs = require('fs')
const { ethers } = require('ethers')
const ABI = require('./abi.json')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'

async function start() { 
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9724413afc4848ccad51e8bf04e803cd');
  let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

  const addresses = []
  for(let i = 0;i < 5555;i++) {
    try {
      const owner = await contract.ownerOf(i)
      console.log(owner)
      addresses.push(owner)
      } catch(e) {
      console.log(`No owner for ${i}`)
    }
  }

  fs.writeFileSync('../output/snapshot.json', JSON.stringify(addresses))
}

start()