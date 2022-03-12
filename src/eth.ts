import ABI from './abi.json'
import SNAPSHOT_ABI from './snapshotAbi.json'
import { ethers } from 'ethers'
import retry from 'async-retry'

const MAX_CONCURRENCY = 200
const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
const SNAPSHOT_ADDRESS = '0xf3fB3F2Dab388Dc0d868be4A349aa1e8939D315D'

export const createContract = function (): ethers.Contract {
  const provider = new ethers.providers.InfuraProvider(
    'mainnet',
    process.env.INFURA_API_KEY
  )
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
}

export const createSnapshotContract = function (): ethers.Contract {
  const provider = new ethers.providers.InfuraProvider(
    'mainnet',
    process.env.INFURA_API_KEY
  )
  return new ethers.Contract(SNAPSHOT_ADDRESS, SNAPSHOT_ABI, provider)
}

export const takeSnapshot = async function (contract) {
  const snapshotContract = createSnapshotContract()

  const maxSupply = 5555
  const portions = 200

  if (contract.address) {
    const concurrency = Math.ceil(maxSupply / portions)
    console.log(`Concurrency is ${concurrency}`)
    const section = Array.from(Array(concurrency), (_, x) => x)
    return (
      await Promise.all(
        section.map(async (x) => {
          return await retry(async (bail) => {
            return await snapshotContract.takeSnapshot(
              contract.address,
              x * portions,
              Math.min(x * portions + portions, maxSupply)
            )
          })
        })
      )
    ).flat()
  }

  let snapshot = []
  for (let i = 0; i < maxSupply; i += MAX_CONCURRENCY) {
    const section = Array.from(Array(MAX_CONCURRENCY), (_, x) => i + x).filter(
      (x) => x < maxSupply
    )
    console.log(`Fetching ${i} to ${i + MAX_CONCURRENCY}`)
    snapshot = snapshot.concat(
      await Promise.all(
        section.map(async (x) => {
          return await retry(async (bail) => {
            return await contract.ownerOf(x)
          })
        })
      )
    )
  }

  return snapshot
}
