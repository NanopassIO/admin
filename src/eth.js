const ABI = require('./abi.json')
const { ethers } = require('ethers')
const retry = require('async-retry')

const MAX_CONCURRENCY = 200
const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'

exports.createContract = function () {
  const provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY)
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
}

exports.takeSnapshot = async function(contract) {
  const maxSupply = 5555
  let snapshot = []
  for(let i = 0;i < maxSupply;i+=MAX_CONCURRENCY) {
    const section = Array.from(Array(MAX_CONCURRENCY), (_,x)=>i+x).filter(x => x < maxSupply)
    console.log(`Fetching ${i} to ${i + MAX_CONCURRENCY}`)
    snapshot = snapshot.concat(await Promise.all(section.map(async x => {
      return await retry(contract.ownerOf(x))
    })))
  }

  return snapshot
}