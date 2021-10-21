import * as utils from './utils.js'

const CACHENAME = 'seeker-cache'

self.addEventListener('install', (ev) => {
  console.log('service worker installing')
  ev.waitUntil(precache())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method != 'GET') return
  event.respondWith(interceptFetch(event))
})

async function interceptFetch(ev) {
  const cache = await caches.open(CACHENAME)
  const url = ev.request.url
  const match = await cache.match(ev.request)
  if (match) {
    // cache hit
    console.log('hit', url)
    return match
  }
  // cache miss
  if (url.search('serviceWorker.js') >= 0 || url.search('testSW.html') >= 0) {
    return fetch(ev.request) // dont you cache this !!
  } else if (
    url.search('AWFImageTiles') >= 0 ||
    url.search('AWFThumbnailTiles') >= 0
  ) {
    //  intercept and spoof special request
    console.log('intercepted', url)
    const paths = url.split('/')
    const time = parseFloat(paths.pop())
    const tz = parseInt(paths.pop())
    const slots = parseInt(paths.pop())
    const cameraID = paths.pop()
    console.log({ time, tz, slots, cameraID })
    const tiles = await utils.getTimeTile(cameraID, tz, time, slots, (ev) => {
      console.log(`status: ${Math.round(100 * ev.percent)} complete`)
    })
    // create blob to store and send back
    const blobtron = new Blob([JSON.stringify(tiles)], {
      type: 'application/json',
    })
    const result = new Response(blobtron)
    await cache.put(ev.request.url, new Response(blobtron))
    return result
  }
  // miss for all other fetches
  console.log('miss', url)
  const resp = await fetch(ev.request)
  if (resp.ok) {
    ev.waitUntil(cache.add(url))
  }
  return resp
}

function precache() {
  return caches.open(CACHENAME).then(function (cache) {
    return cache.addAll([])
  })
}
