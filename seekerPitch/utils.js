
export function dateToYearsDaysHoursUTC(date) {
    const days =
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
            Date.UTC(date.getFullYear(), 0, 0)) /
        (24 * 60 * 60 * 1000)
    const years = date.getUTCFullYear()
    const hours = date.getUTCHours()
    return { days, years, hours }
}

async function fetchWithCache(url, cacheName = 'seeker-cache'){
  const cache = await caches.open(cacheName)
  const req = new Request(url)
  const cacheResponse = await cache.match(req)
  if(cacheResponse && cacheResponse.ok){
    console.log('found in cache', url)
    return cacheResponse
  }
  const addResponse = await cache.add(req)
  const cacheResponse2 = await cache.match(req)
  return cacheResponse2
}



export async function getIndexPageByUsualSuspectsSearch(cameraID, approxTime) {
    const { days, years, hours } = dateToYearsDaysHoursUTC(new Date(approxTime))
    const urls = [
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis/${cameraID}/${years}/${days}/${hours}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis2/${cameraID}/${years}/${days}/${hours}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis/${cameraID}/${years}/${days}/${hours}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis2/${cameraID}/${years}/${days}/${hours}`,
    ]
    for (let x of urls) {
        try {
            const response = await fetchWithCache(x)
            console.log(response)
            if (response.status == 200) {
                return { path: x, response }
            }
        } catch (err) {
            console.log(err)
        }
    }
}

export function parseIndexPageData(indexText) {
    // extract the filenames and times
    const jpegs = indexText.match(/href(.*?)jpg/g) || []
    const pngs = indexText.match(/href(.*?)png/g) || []
    const allNames = jpegs.concat(pngs).map((x) => x.substr(6))
    const allTheStuff = allNames
        .map((x) => {
            const time = 1000 * parseFloat(x.split('.png')[0].split('.jpg')[0])
            if (isNaN(time)) {
                console.warn('failed to parse time on', x)
                return undefined
            }
            return {
                time,
                filename: x,
                date: new Date(time),
            }
        })
        .filter((x) => x !== undefined)
    return allTheStuff
}
