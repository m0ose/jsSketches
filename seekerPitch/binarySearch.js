/**
 * Binary search of numbers that returns nearest match
 *
 * @param {Array} sortedList list must be sorted in ascending order
 * @param {number} searchTerm
 * @param {string} optionalKey
 * @returns index
 */
export function binarySearchForNumber(sortedList, searchTerm, optionalKey) {
  // Initialize left and right search indices
  let l = 0
  let r = sortedList.length - 1
  // search
  while (l <= r) {
    const m = Math.floor((r + l) / 2)
    let val = sortedList[m]
    if (optionalKey) val = sortedList[m][optionalKey]
    if (isNaN(val)) throw 'nan found'
    if (val == searchTerm) {
      return { index: m, value: sortedList[m] }
    } else if (searchTerm > val) {
      l = m + 1
    } else if (searchTerm < val) {
      r = m - 1
    }
  }

  // Not found in list. The closest is either r or l.
  l = Math.min(sortedList.length - 1, Math.max(0, l))
  r = Math.min(sortedList.length - 1, Math.max(0, r))
  let valL = optionalKey ? sortedList[l][optionalKey] : sortedList[l]
  let valR = optionalKey ? sortedList[r][optionalKey] : sortedList[r]
  if (Math.abs(valR - searchTerm) < Math.abs(valL - searchTerm)) {
    return { index: r, value: sortedList[r] }
  }
  return { index: l, value: sortedList[l] }
}
