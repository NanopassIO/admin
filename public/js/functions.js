let $;

if(typeof window !== 'undefined') {
  $ = window.$;
}

// This is for Skvlpunks DAO, since they cannot claim prizes through the DAO,
// we provide an alternative address for prizes for them.
const ADDRESS_MAPPING = {
  '0xcdA2E4b965eCa883415107b624e971c4Cefc4D8C': '0xEfEE7fD9aF43945E7b7D9655592600A6a63eFf0D'
}

async function fetchResponse(url, params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(url, {
        body: JSON.stringify(params),
        method: 'POST'
    })
    if(!response.ok) {
      throw new Error('An error occurred')
    }
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function preloadBatch(params, setError) {
  await fetchResponse('/.netlify/functions/preload-batch-background', params, setError)
}

export async function activateBatch(params, setError) {
  await fetchResponse('/.netlify/functions/activate-batch-background', params, setError)
}

export async function overrideActiveBatch(params, setError) {
  await fetchResponse('/.netlify/functions/override-active-batch', params, setError)
}

export async function addPrize(params, setError) {
  await fetchResponse('/.netlify/functions/add-prize', params, setError)
}

export async function deletePrize(params, setError) {
  await fetchResponse('/.netlify/functions/delete-prize', params, setError)
}

export async function giveFragments(params, setError) {
  await fetchResponse('/.netlify/functions/give-fragments', params, setError)
}

export async function getActiveBatch(setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-active-batch', {
      method: 'POST'
    })

    return await response.json()
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}

function convertToCsv(items, overrideHeaders) {
  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  const header = overrideHeaders ?? Object.keys(items[0])
  return [
    header.join(','), // header row first
    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n')
}

function performAddressReplacement(address) {
  return ADDRESS_MAPPING[address] ? ADDRESS_MAPPING[address] : address
}

export function generateBatchCsv(json) {
  const converted = json.Items.map(x => ({
    ...x,
    address: performAddressReplacement(x.address),
    prizes: JSON.parse(x.prizes ? x.prizes : '[]').join('+'),
    claimed: JSON.parse(x.claimed ? x.claimed : '[]').join('+')
  }))
  return convertToCsv(converted, ['address', 'balance', 'prizes', 'claimed'])
}

export async function getBatch(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const json = await response.json()
    //console.log(JSON.stringify(json, null, 2))
    const csv = generateBatchCsv(json)

    const uriContent = "data:text/csv," + encodeURIComponent(csv);
    window.open(uriContent, 'batch.csv');
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getPrizeList(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-prizes', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const json = await response.json()
    const csv = convertToCsv(json.Items)

    const uriContent = "data:text/csv," + encodeURIComponent(csv);
    window.open(uriContent, 'prizes.csv');
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}


export async function getAccounts(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-accounts', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const json = await response.json()
    const converted = json.Items.map(x => ({
      ...x,
      address: performAddressReplacement(x.address),
      inventory: JSON.parse(x.inventory ? x.inventory : '[]').map(y => y.name).join('+')
    }))
    const csv = convertToCsv(converted, ['address', 'discord', 'fragments', 'inventory'])

    const uriContent = "data:text/csv," + encodeURIComponent(csv);
    window.open(uriContent, 'accounts.csv');
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function winners(params, search, setError) {
  $.LoadingOverlay('show')
  try {
    const accountsResponse = await fetch('/.netlify/functions/get-accounts', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const accountsJson = (await accountsResponse.json()).Items.map(x => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))
   
    const batchResponse = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const batchJson = (await batchResponse.json()).Items.map(x => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))

    const accountByAddress = addr => {
      return accountsJson.find(a => {
        return a.address === addr
      })
    }

    const merged = []
    
    for(const batch of batchJson) {
      const prizeArray = JSON.parse(batch.claimed ? batch.claimed : '[]')
      const discord = accountByAddress(batch.address) ? accountByAddress(batch.address).discord : 'Not found'
      for(const prize of prizeArray) {
        if(prize.toLowerCase().includes(search)) {
          merged.push({
            prize: prize,
            address: batch.address,
            discord: discord
          })
        }
      }
    }

    const csv = convertToCsv(merged, ['prize', 'address', 'discord'])

    const uriContent = "data:text/csv," + encodeURIComponent(csv);
    window.open(uriContent, `${search}_winners.csv`);
  } catch(e) {
    setError(e.message) 
  } finally {
    $.LoadingOverlay('hide')
  }
}
