export function dateToYearsDaysHoursUTC(date) {
    const days =
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
            Date.UTC(date.getFullYear(), 0, 0)) /
        (24 * 60 * 60 * 1000)
    const years = date.getUTCFullYear()
    const hours = date.getUTCHours()
    return { days, years, hours }
}

async function fetchWithCache(url, cacheName = 'seeker-cache') {
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

export async function getIndexPageByUsualSuspectsSearch(cameraID, approxTime) {
    const { days, years, hours } = dateToYearsDaysHoursUTC(new Date(approxTime))
    const awfPath = `${cameraID}/${years}/${days.toString().padStart(3,'0')}/${hours.toString().padStart(2,'0')}`
    const urls = [
      `https://proxy.acequia.io/proxy?url=https://node.redfish.com/Documents/cody/timeLapse/images/${cameraID}/${years}/${days}/${hours}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes4/redis2/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis/${awfPath}`,
        `https://proxy.acequia.io/proxy?url=https://map.alertwildfire.ucsd.edu/fireframes3/redis2/${awfPath}`,
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

export function sampleTimeListForZ(z, timeList) {
    return timeList.reduce((acc, curr) => {
        if (acc.length <= 0) return [curr]
        const prev = acc[acc.length - 1]
        const elapsed = Math.abs(prev.time - curr.time)
        // prettier-ignore
        if (elapsed > (2 ** z) * 1000) return acc.concat(curr)
        // console.log(elapsed)
        return acc
    }, [])
}

// For thumbnails,
//    the directory is either https://map.alertwildfire.ucsd.edu/fireframes4/thumbs/${cameraID}/${years}/${days}/${hours}
//    or https://map.alertwildfire.ucsd.edu/fireframes3/thumbs/${cameraID}/${years}/${days}/${hours}
