const fs = require('fs')
const { ethers } = require('ethers')
const ABI = require('./abi.json')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'

async function start() { 
  const provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY);
  let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

  const maxSupply = 5555
  let addresses = []
  const portions = 250
  for(let i = 0;i < maxSupply;i+=portions) {
    const section = Array.from(Array(portions), (_,x)=>i+x).filter(x => x < maxSupply)
    console.log(`Fetching ${i} to ${i + portions}`)
    addresses = addresses.concat(await Promise.all(section.map(async x => {
        return await contract.ownerOf(x)
      })))
  }

  fs.writeFileSync('../output/snapshot.json', JSON.stringify(addresses, null, 2))
}

start()
