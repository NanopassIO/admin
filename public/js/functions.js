
export async function preloadBatch(params) {
  await fetch('/.netlify/functions/preload-batch-background', {
      body: JSON.stringify(params),
      method: 'POST'
  })
}