const $ = window.$;

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

export async function getBatch(params, setError) {
  $.LoadingOverlay('show')
  try {
    const response = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
    })

    const json = await response.json()
    console.log(JSON.stringify(json, null, 2))
    const csv = convertToCsv(json.Items, ['address', 'balance', 'prizes', 'claimed'])

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
