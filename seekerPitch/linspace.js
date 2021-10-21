/**
 * Return evenly spaced numbers over a specified interval
 *
 * @param {number} start
 * @param {number} stop
 * @param {int} number
 * @param {boolean} includeStop
 * @param {Float64Array} DataType
 * @returns {Float64Array}
 */
export function linspace(
  start,
  stop,
  number,
  includeStop = true,
  DataType = Float64Array
) {
  const result = new DataType(number + 1 * includeStop)
  for (let x = 0; x < result.length; x++) {
    result[x] = start + (stop - start) * (x / number)
  }
  return result
}

export function linspaceMiddle(start, stop, slotsCount) {
  return linspace(start, stop, slotsCount, false).map(
    (x) => x + (stop - start) / (2 * slotsCount)
  )
}
