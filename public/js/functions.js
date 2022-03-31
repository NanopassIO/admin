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
function handleError(response) {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        // throw new Error(`${response.status}, ${response.statusText}`)
        throw new Error('Bad/invalid request.')
      case 401:
        throw new Error('Please enter a valid password.')
      case 403:
        throw new Error('Sorry, you do not have the permission to access the requested resource.')
      case 404:
        throw new Error('Sorry, request not found.')
      case 405:
        throw new Error('Unable to access the requested resource.')
      case 500:
        throw new Error('Something went wrong.')
    }
    
  }
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
    handleError(response)
  } catch (e) {
    setError(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
}

export async function preloadBatch(params, setError) {
  await fetchResponse(
    '/.netlify/functions/preload-batch-background',
    params,
    setError
  )
}

export async function activateBatch(params, setError) {
  await fetchResponse(
    '/.netlify/functions/activate-batch-background',
    params,
    setError
  )
}

export async function overrideActiveBatch(params, setError) {
  await fetchResponse(
    '/.netlify/functions/override-active-batch',
    params,
    setError
  )
}

export async function addPrize(params, setError) {
  await fetchResponse('/.netlify/functions/add-prize', params, setError)
}

export async function giveBalance(params, setError) {
  await fetchResponse(
    '/.netlify/functions/testing-give-balance',
    params,
    setError
  )
}

export async function deletePrize(params, setError) {
  await fetchResponse('/.netlify/functions/delete-prize', params, setError)
}

export async function addMarketplaceItem(params, setError) {
  await fetchResponse('/.netlify/functions/add-marketplace', params, setError)
}

export async function getMarketplaceItems() {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-marketplace', {
      method: 'POST'
    })
    handleError(response)
    return await response.json()
  } catch (e) {
    console.log(e.message)
  } finally {
    $.LoadingOverlay('hide')
  }
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
    handleError(response)

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
    const response = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    handleError(response)
  
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
    const response = await fetch('/.netlify/functions/get-address-logs', {
      body: JSON.stringify(params),
      method: 'POST'
    })

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
    const response = await fetch('/.netlify/functions/get-prizes', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    handleError(response)

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
    const response = await fetch('/.netlify/functions/get-accounts', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    handleError(response)
    
    const json = await response.json()
    const converted = json.map((x) => ({
      ...x,
      address: performAddressReplacement(x.address),
      inventory: JSON.parse(x.inventory ? x.inventory : '[]')
        .map((y) => y.name)
        .join('+')
    }))

    const ws = XLSX.utils.json_to_sheet(converted, {
      header: ['address', 'discord', 'fragments', 'inventory']
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
    const response = await fetch('/.netlify/functions/get-purchases', {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(response)

    const objToStr = (obj) => {
      return Object.keys(obj)
        .map((k) => `${k}: ${obj[k]}`)
        .join(' | ')
    }

    const getSingleAddressDiscord = async (x) => {
      try {
        const response = await fetch('/.netlify/functions/get-account', {
          body: JSON.stringify({
            data: { address: x.address },
            password: params.password
          }),
          method: 'POST'
        })
        const json = await response.json()

        return {
          ...x,
          address: performAddressReplacement(x.address),
          itemData: objToStr(JSON.parse(x.itemData)),
          itemName: x.itemName,
          discord: json.Items[0].discord ?? '',
          discordDeveloperID: json.Items[0].discordDevId ?? ''
        }
      } catch (e) {
        throw e
      }
    }

    const json = await response.json()
    const converted = json.map((x) => {
      return getSingleAddressDiscord(x)
    })

    Promise.all(converted)
      .then((result) => {
        const ws = XLSX.utils.json_to_sheet(result, {
          header: [
            'address',
            'itemData',
            'itemName',
            'discord',
            'discordDeveloperID'
          ]
        })
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(
          wb,
          ws,
          params.data ? `${params.data.name} Purchases` : 'Purchases'
        )
        XLSX.writeFile(
          wb,
          params.data ? `${params.data.name} Purchases.xlsx` : 'Purchases.xlsx'
        )
        $.LoadingOverlay('hide')
      })
      .catch((err) => {
        console.log(err)
        $.LoadingOverlay('hide')
        throw err
      })
  } catch (e) {
    $.LoadingOverlay('hide')
    setError(e.message)
  }
}

export async function winners(params, search, setError) {
  $.LoadingOverlay('show')
  try {
    const accountsResponse = await fetch('/.netlify/functions/get-accounts', {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(accountsResponse)

    const accountsJson = (await accountsResponse.json()).map((x) => ({
      ...x,
      address: performAddressReplacement(x.address)
    }))

    const batchResponse = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
    })
    handleError(batchResponse)

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
