let $
let XLSX

if (typeof window !== 'undefined') {
  $ = window.$
  XLSX = window.XLSX
}

// This is for Skvlpunks DAO, since they cannot claim prizes through the DAO,
// we provide an alternative address for prizes for them.
const ADDRESS_MAPPING = {
  '0xcdA2E4b965eCa883415107b624e971c4Cefc4D8C':
    '0xEfEE7fD9aF43945E7b7D9655592600A6a63eFf0D'
}
function handleError(response, setError) {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        // throw new Error(`${response.status}, ${response.statusText}`)
        throw new Error('Bad/invalid request.')
      case 401:
        throw new Error('Please enter a valid password.')
      case 403:
        throw new Error(
          'Sorry, you do not have the permission to access the requested resource.'
        )
      case 404:
        throw new Error('Sorry, request not found.')
      case 405:
        throw new Error('Unable to access the requested resource.')
      case 500:
        throw new Error('Something went wrong.')
    }

    return true
  }

  setError('')
  return false
}

const scanAccountsWithPagination = async (
  params,
  setError,
  attributes = ''
) => {
  let LastEvaluatedKey = undefined
  let scanResult = await fetch(functionHostResolver('get-accounts'), {
    body: JSON.stringify({
      ...params,
      data: {
        attributes: attributes
      }
    }),
    method: 'POST'
  })

  handleError(scanResult, setError)

  const scanResultJson = await scanResult.json()

  let combined = scanResultJson.Items
  LastEvaluatedKey = scanResultJson.LastEvaluatedKey

  while (LastEvaluatedKey) {
    const nextPage = await fetch(functionHostResolver('get-accounts'), {
      body: JSON.stringify({
        ...params,
        data: {
          attributes: attributes,
          ExclusiveStartKey: LastEvaluatedKey
        }
      }),
      method: 'POST'
    })

    handleError(nextPage, setError)
    const nextPageJson = await nextPage.json()

    if (nextPageJson.Count === 0) break

    combined = [...combined, ...nextPageJson.Items]
    LastEvaluatedKey = nextPageJson.LastEvaluatedKey
  }

  return combined
}

async function fetchResponse(url, params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(url, {
      body: JSON.stringify(params),
      method: 'POST'
    })
    // if (!response.ok) {
    //   throw new Error('An error occurred')
    // }
    handleError(response, setError)
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function preloadBatch(params, setError) {
  await fetchResponse(
    functionHostResolver('preload-batch-background'),
    params,
    setError
  )
}

export async function activateBatch(params, setError) {
  await fetchResponse(
    functionHostResolver('activate-batch-background'),
    params,
    setError
  )
}

export async function overrideActiveBatch(params, setError) {
  await fetchResponse(
    functionHostResolver('override-active-batch'),
    params,
    setError
  )
}

export async function addPrize(params, setError) {
  await fetchResponse(functionHostResolver('add-prize'), params, setError)
}

export async function giveBalance(params, setError) {
  await fetchResponse(
    functionHostResolver('testing-give-balance'),
    params,
    setError
  )
}

export async function deletePrize(params, setError) {
  await fetchResponse(functionHostResolver('delete-prize'), params, setError)
}

export async function addMarketplaceItem(params, setError) {
  await fetchResponse(functionHostResolver('add-marketplace'), params, setError)
}

export async function getMarketplaceItems(setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-marketplace'), {
      method: 'POST',
      body: JSON.stringify({})
    })
    handleError(response, setError)
    return await response.json()
  } catch (e) {
    console.log(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getGamePrizes(setError, activeBatch) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-game-prizes'), {
      body: JSON.stringify({
        data: { batch: activeBatch }
      }),
      method: 'POST'
    })
    handleError(response, setError)
    return await response.json()
  } catch (e) {
    console.log(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getAllBids(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-all-bids'), {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(response, setError)

    const json = await response.json()

    const converted = json.map((x) => ({
      address: x.address,
      prize: x.prizeToBidFor,
      bid: x.bid
    }))

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: ['address', 'bid', 'prize']
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${converted[0].prize} Bids`)
    XLSX.writeFile(wb, `${converted[0].prize} Bids.xlsx`)

    return json
  } catch (e) {
    console.log(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function massRefund(params, setError) {
  $.LoadingOverlay('show')
  try {
    const addresses = params.data.address
      .split('\n')
      .filter((x) => x.length > 1)
    for (const address of addresses) {
      const response = await fetch(functionHostResolver('give-fragments'), {
        body: JSON.stringify({
          password: params.password,
          data: {
            address: address.trim(),
            amount: params.data.amount
          }
        }),
        method: 'POST'
      })

      if (!handleError(response, setError)) {
        console.log(`Refunded ${address} with ${params.data.amount} fragments`)
      }
    }
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function giveFragments(params, setError) {
  await fetchResponse(functionHostResolver('give-fragments'), params, setError)
}

export async function getActiveBatch(setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-active-batch'), {
      method: 'POST',
      body: JSON.stringify({})
    })
    handleError(response, setError)

    return await response.json()
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

function performAddressReplacement(address) {
  return ADDRESS_MAPPING[address] ? ADDRESS_MAPPING[address] : address
}

export async function getBatch(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-batch'), {
      body: JSON.stringify(params),
      method: 'POST'
    })

    handleError(response, setError)

    const json = await response.json()
    const converted = json.Items.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address),
      prizes: JSON.parse(x.prizes ? x.prizes : '[]').join('+'),
      claimed: JSON.parse(x.claimed ? x.claimed : '[]').join('+')
    }))

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: ['address', 'balance', 'prizes', 'claimed']
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Batch')
    XLSX.writeFile(wb, 'Batch.xlsx')
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getAddressLogs(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-address-logs'), {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(response, setError)

    const getInvItemNames = (inv) => {
      return JSON.parse(inv).map((i) => i.name)
    }

    const json = await response.json()
    const converted = json.Items.map((x) => {
      const dateObject = new Date(x.timestamp)
      const readableDate = dateObject.toLocaleString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        timeZoneName: 'short'
      })

      return {
        ...x,
        address: performAddressReplacement(x.address),
        activity: x.activity,
        oldFrags: x.oldFrags,
        newFrags: x.newFrags,
        oldInv: (x.oldInv ? getInvItemNames(x.oldInv) : []).join('+'),
        newInv: (x.newInv ? getInvItemNames(x.newInv) : []).join('+'),
        prize: x.prize ? x.prize.name ?? x.prize : '',
        receivingAddress: x.receivingAddress,
        sentFrags: x.sentFrags,
        timestamp: readableDate
      }
    })

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: [
        'address',
        'activity',
        'oldFrags',
        'newFrags',
        'oldInv',
        'newInv',
        'prize',
        'receivingAddress',
        'sentFrags',
        'timestamp'
      ]
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Logs')
    XLSX.writeFile(wb, `Logs (${params.data.address}).xlsx`)
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getPrizeList(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-prizes'), {
      body: JSON.stringify(params),
      method: 'POST'
    })

    handleError(response, setError)

    const json = await response.json()
    const ws = XLSX.utils.json_to_sheet(json.Items)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prizes')
    XLSX.writeFile(wb, 'Prizes.xlsx')
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getAccounts(params, setError) {
  $.LoadingOverlay('show')
  try {
    const combined = await scanAccountsWithPagination(params, setError)

    const converted = combined.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address),
      inventory: JSON.parse(x.inventory ? x.inventory : '[]')
        .map((y) => y.name)
        .join('+')
    }))

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: [
        'address',
        'badLuckCount',
        'discord',
        'discordDevId',
        'fragments',
        'inventory'
      ]
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts')
    XLSX.writeFile(wb, 'Accounts.xlsx')
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function getPurchases(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch(functionHostResolver('get-purchases'), {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(response, setError)

    const objToStr = (obj) => {
      return Object.keys(obj)
        .map((k) => `${k}: ${obj[k]}`)
        .join(' | ')
    }

    const allAccounts = await scanAccountsWithPagination(
      params,
      setError,
      'address, wlAddress, discord, discordDevId'
    )
    const accountsJson = allAccounts.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))

    const accountByAddress = (addr) => {
      return accountsJson.find((a) => {
        return a.address === addr
      })
    }

    const json = await response.json()
    const converted = json.map((x) => {
      const acc = accountByAddress(x.address)
      return {
        ...x,
        address: acc.wlAddress ?? performAddressReplacement(x.address),
        originalAddress: performAddressReplacement(acc.address),
        itemData: objToStr(JSON.parse(x.itemData)),
        itemName: x.itemName,
        discord: acc.discord ?? '',
        discordDeveloperID: acc.discordDevId ?? ''
      }
    })

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: [
        'address',
        'itemData',
        'itemName',
        'discord',
        'discordDeveloperID'
      ]
    })
    const cleanName = params.data?.name.replace('/', '-')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      params.data ? `${cleanName.slice(0, 20)} Purchases` : 'Purchases'
    )
    XLSX.writeFile(
      wb,
      params.data
        ? `${cleanName.slice(0, 15)} Purchases.xlsx`
        : 'Purchases.xlsx'
    )
    $.LoadingOverlay('hide')
  } catch (e) {
    $.LoadingOverlay('hide')
    setError(e.message)
  }
}

export async function winners(params, search, setError) {
  $.LoadingOverlay('show')
  try {
    const allAccounts = await scanAccountsWithPagination(
      params,
      setError,
      'discord, address'
    )

    const accountsJson = allAccounts.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))

    const batchResponse = await fetch(functionHostResolver('get-batch'), {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(batchResponse, setError)

    const batchJson = (await batchResponse.json()).Items.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))

    const accountByAddress = (addr) => {
      return accountsJson.find((a) => {
        return a.address === addr
      })
    }

    const merged = []

    for (const batch of batchJson) {
      const prizeArray = JSON.parse(batch.claimed ? batch.claimed : '[]')
      const account = accountByAddress(batch.address)

      const discord = account ? account.discord : 'Not found'

      const wlAddress = account
        ? account.wlAddress ?? account.address
        : 'Not found'

      for (const prize of prizeArray) {
        if (prize.toLowerCase().includes(search) || search === null) {
          merged.push({
            prize: prize,
            address: wlAddress,
            discord: discord,
            originalAddress: account.address
          })
        }
      }
    }

    const ws = XLSX.utils.json_to_sheet(merged)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Winners')
    XLSX.writeFile(wb, `${search ?? 'nft & wl'}_winners.xlsx`)
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function addGamePrize(params, setError) {
  await fetchResponse(functionHostResolver('add-game-prize'), params, setError)
}

export async function calculateWinner(params, setError) {
  await fetchResponse(
    functionHostResolver('calculate-winner'),
    params,
    setError
  )
}

const functionHostResolver = (functionName) => {
  return `/.netlify/functions/${functionName}`
}
