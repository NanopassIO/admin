const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const start = async () => {
  const contractAddress = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
  const toTokenId = 5555

  const portions = 250
  for(let i = 0;i < toTokenId;i+=portions) {
    const section = Array.from(Array(portions), (_,x)=>i+x).filter(x => x < toTokenId)
    await Promise.all(section.map(async x => {
      const url = `https://api.opensea.io/api/v1/asset/${contractAddress}/${x}/?force_update=true`; 
      const response = await fetch(url); 
      //console.log(response)
    }))
    console.log(`Done with ${i} to ${i+portions}`); 
  }
}

start().catch(e => console.log(e))