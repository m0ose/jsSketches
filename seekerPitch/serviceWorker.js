import * as utils from './getTimeTile.js'

const CACHENAME = 'seeker-cache'

self.addEventListener('install', (ev) => {
  console.log('service worker installing')
  ev.waitUntil(precache())
})

function precache() {
  return caches.open(CACHENAME).then(function (cache) {
    return cache.addAll([
      './getTimeTile.js',
      './linspace.js',
      './binarySearch.js',
      './timeUtils.js',
    ])
  })
}

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
    // todo update if not an awf link
    if (url.search('alertwildfire.ucsd.edu') <= 0) {
      console.log('TODO needs updating')
    }

    return match
  }
  // cache miss
  const isAWF = url.search('AWFImageTiles') >= 0
  const isAWFThumb = url.search('AWFThumbnailTiles') >= 0
  if (url.search('serviceWorker.js') >= 0 || url.search('testSW.html') >= 0) {
    return fetch(ev.request) // dont you cache this !!
  } else if (isAWF || isAWFThumb) {
    //  intercept and spoof special request
    console.log('intercepted', url)
    const paths = url.split('/')
    const time = parseFloat(paths.pop())
    const tz = parseInt(paths.pop())
    const slots = parseInt(paths.pop())
    const cameraID = paths.pop()
    // console.log({ time, tz, slots, cameraID })
    let indexFunc = utils.fullImageIndexPageURLs
    if (isAWFThumb) indexFunc = utils.thumbnailIndexPageURLs
    function statusFunc(ev) {
      console.log(`status: ${Math.round(100 * ev.percent)} complete`)
    }
    const tiles = await utils.getTimeTile(
      cameraID,
      tz,
      time,
      slots,
      statusFunc,
      indexFunc
    )
    // create blob to store and send back
    const blobtron = new Blob([JSON.stringify(tiles)], {
      type: 'application/json',
    })
    const result = new Response(blobtron)
    await cache.put(ev.request.url, result.clone())
    return result
  }
  // miss for all other fetches
  console.log('miss', url)
  const resp = await fetch(url)
  if (resp.ok) {
    // ev.waitUntil(cache.add(url))
    console.log('caching', url)
    ev.waitUntil(cache.put(url, resp.clone()))
  }
  return resp
}
