import * as utils from './utils.js'

const CACHENAME = 'seeker-cache'

self.addEventListener('install', function (ev) {
    // Perform install steps
    console.log('service worker installing')
    ev.waitUntil(precache())
})

self.addEventListener('fetch', function (event) {
    event.respondWith(interceptFetch(event))
    // event.waitUntil(updateCache(event.request))
})

async function interceptFetch(ev) {
    const cache = await caches.open(CACHENAME)
    const url = ev.request.url
    const match = await cache.match(ev.request)
    if (match) {
        console.log('hit', url)
        return match
    }
    if (url.search('serviceWorker.js') >= 0 || url.search('testSW.html') >= 0) {
        return fetch(ev.request) // dont you cache this !!
    } else if (url.search('tileCache') >= 0) {
        console.log('intercepted', url)
        const paths = url.split('/')
        const time = parseFloat(paths.pop())
        const tz = parseInt(paths.pop())
        const slots = parseInt(paths.pop())
        const cameraID = paths.pop()
        console.log({ time, tz, slots, cameraID })
        const tiles = await utils.getTimeTile(
            cameraID,
            tz,
            time,
            slots,
            (ev) => {
                console.log(`status: ${Math.round(100 * ev.percent)} complete`)
            }
        )
        const bloob = new Blob([JSON.stringify(tiles)], {
            type: 'application/json',
        })
        const result = new Response(bloob)
        await cache.put(ev.request.url, new Response(bloob))
        return result
    }
    // cache miss
    console.log('miss', url)
    const resp = await fetch(ev.request)
    if (resp.ok) {
        cache.add(url)
    }
    return resp
}

function precache() {
    return caches.open(CACHENAME).then(function (cache) {
        return cache.addAll([])
    })
}
