const fs = require('fs')
const preReveal = require('../output/snapshot_prereveal.json')
const postReveal = require('../output/snapshot.json')

let preRH = {}
for(const address of preReveal) {
  preRH[address] = preRH[address] ? preRH[address] + 1 : 1
}

let postRH = {}
for(const address of postReveal) {
  postRH[address] = postRH[address] ? postRH[address] + 1 : 1
}

const min = (x,y) => x > y ? y : x

let holders = {}
for(const address of Object.keys(preRH)) {
  const count = min(preRH[address] ?? 0, postRH[address] ?? 0)
  if(count > 0) {
    holders[address] = count
  }
}

//console.log(JSON.stringify(holders, null, 2))
console.log(Object.keys(holders).length)
console.log(Object.keys(holders).reduce((p,c) => p+holders[c], 0))


let addresses = []
for(const address of Object.keys(holders)) {
  addresses.push({ address, balance: holders[address] })
}

fs.writeFileSync('../output/xmas_bb.json', JSON.stringify(addresses))