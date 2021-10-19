import { getDatePath } from './timeUtils.js'
import { binarySearchForNumber } from './binarySearch.js'
import { linspaceMiddle } from './linspace.js'

/**
 * 
 * @param {String} cameraID 
 * @param {int} tz 
 * @param {Number} timeMS 
 * @param {int} slotCount 
 * @returns {Array} {filename, url, timestamp, date, cameraID}
 */
export async function getTile(cameraID, tz, timeMS, slotCount) {
    const optimalTimes1 = optimalTileSlotTimes(tz, timeMS, slotCount)
    // download the index pages
    const actualTimes = []
    for (let i = 0; i < optimalTimes1.length; i++) {
        const t = optimalTimes1[i]
        try {
            console.log('getting', cameraID, t)
            const entries = await getIndexPageJSON(cameraID, t)
            const {index, value} = binarySearchForNumber(entries, t, 'timestamp')
            const entry = value//entries[index]
            actualTimes.push(entry)
            console.log(index, entry)
        } catch (err) {
            console.error(err)
        }
    }
    const actualTimesUnique = removeDuplicatesFromSortedList(
        actualTimes,
        'filename'
    )

    console.log('actualTimes', actualTimes)
    console.log('actualTimesUnique', actualTimesUnique)

    return actualTimesUnique
}

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

async function getIndexPageJSON(cameraID, approxTime) {
    const { path, response } = await getImageIndexPage(cameraID, approxTime)
    console.log('Parsing index Path', path)
    const text = await response.text()
    const entries = await parseIndexPageData(text)
    const entriesWithURL = entries.map((x) => {
        return {
            ...x,
            url: `${path}/${x.filename}`,
            cameraID: cameraID,
        }
    })
    return entriesWithURL
}

async function getImageIndexPage(cameraID, approxTime) {
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
    return response
}

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

function parseIndexPageData(indexText) {
    // extract the filenames and times
    const jpegs = indexText.match(/href(.*?)jpg/g) || []
    const pngs = indexText.match(/href(.*?)png/g) || []
    const allNames = jpegs.concat(pngs).map((x) => x.substr(6))
    const allTheStuff = allNames
        .map((x) => {
            const timestamp = 1000 * parseFloat(x.split('.png')[0].split('.jpg')[0])
            if (isNaN(timestamp)) {
                console.warn('failed to parse timestamp on', x)
                return undefined
            }
            return {
                timestamp,
                filename: x,
                date: new Date(timestamp),
            }
        })
        .filter((x) => x !== undefined)
    return allTheStuff
}

function tileTimeExtent(tz, timeMS) {
    const n2 = 2 ** tz
    const timeSec = timeMS / 1000
    // prettier-ignore
    const start = Math.floor((timeSec) / n2) * n2
    const end = start + n2
    return [start * 1000, end * 1000]
}

function optimalTileSlotTimes(tz, timeMS, slotCount) {
    const [start, stop] = tileTimeExtent(tz, timeMS)
    console.log({ start, stop })
    const times = linspaceMiddle(start, stop, slotCount)
    console.log(times)
    return times
}

function removeDuplicatesFromSortedList(sortedList, optionalKey) {
    const result = [sortedList[0]]
    for (let i = 1; i < sortedList.length; i++) {
        const prev = result[result.length - 1]
        const curr = sortedList[i]
        if (optionalKey) {
            if (prev[optionalKey] != curr[optionalKey]) {
                result.push(curr)
            }
        } else {
            if (prev !== curr) {
                result.push(curr)
            }
        }
    }
    return result
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
