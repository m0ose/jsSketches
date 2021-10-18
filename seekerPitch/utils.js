import { getDatePath } from './timeUtils.js'

async function fetchWithCache(url) {
    const cacheName = 'seeker-cache'
    const cache = await caches.open(cacheName)
    const req = new Request(url)
    const cacheResponse = await cache.match(req)
    if (cacheResponse && cacheResponse.ok) {
        console.log('found in cache', url)
        return cacheResponse
    }
    const addResponse = await cache.add(req)
    const cacheResponse2 = await cache.match(req)
    return cacheResponse2
}

export async function getImageIndexPage(cameraID, approxTime) {
    const approxDate = new Date(approxTime)
    const awfPath = getDatePath(approxDate)

    // check database if it has been fetched. This will be needed for checking tree structure
    const indexURLS = [
        `https://proxy.acequia.io/proxy?url=https://node.redfish.com/Documents/cody/timeLapse/images/${cameraID}/${getDatePath(
            approxDate,
            false
        )}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis/${cameraID}/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis2/${cameraID}/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis/${cameraID}/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis2/${cameraID}/${awfPath}`,
    ]
    const response = await _getIndexPageByUsualSuspectsSearch(indexURLS)
    if(response){
      // mark that it was fetched
      return response
    } else {
      // put marker in db to say we checked
    }
}

// export async function getThumbnailIndexPage(cameraID, approxTime) {
//     const approxDate = new Date(approxTime)
//     const awfPath = getDatePath(approxDate)

//     const indexURLS = [
//         `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/thumbs/${cameraID}/${awfPath}`,
//         `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/thumbs/${cameraID}/${awfPath}`,
//     ]
//     return _getIndexPageByUsualSuspectsSearch(indexURLS)
// }

async function _getIndexPageByUsualSuspectsSearch(indexURLS) {
    for (let x of indexURLS) {
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

export function sampleFromTimeListForZ(z, timeList) {
    return timeList.reduce((acc, curr) => {
        if (acc.length <= 0) return [curr]
        const prev = acc[acc.length - 1]
        const elapsed = Math.abs(prev.time - curr.time)
        // prettier-ignore
        if (elapsed > (2 ** z) * 1000) return acc.concat(curr);
        // console.log(elapsed)
        return acc
    }, [])
}


export function linspace(start,stop, number, includeStop = true, DataType = Float64Array) {
  const result = new DataType(number + 1*includeStop)
  for (let x=0; x<result.length; x++) {
    result[x] = start + (stop-start)*(x/number) 
  }
  return result
}

export function getMiddleTimeStamps(start,stop, slotsCount) {
  return linspace(start, stop, slotsCount, false).map(x=>x+(stop-start)/(2*slotsCount))
}

export function getTileTimeRange(tz, time) {
  const n2 = 2 ** tz
  const start = Math.floor(time/n2) * n2 
  const end = start + n2
  return [start,end]
}

export function getOptimalTileSlotTimes(tz,time, slotCount) {
  const [start, stop] = getTileTimeRange(tz,time)
  console.log({start,stop})
  const times = getMiddleTimeStamps(start, stop, slotCount)
  console.log(times)
  return times
}

