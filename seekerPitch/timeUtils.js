export function getDatePath(date, pad = true) {
  let { years, days, hours } = dateToYearsDaysHoursUTC(date)
  if (pad) {
    days = days.toString().padStart(3, '0')
    hours = hours.toString().padStart(2, '0')
  }
  return `${years}/${days}/${hours}`
}

function dateToYearsDaysHoursUTC(date) {
  const days =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
    (24 * 60 * 60 * 1000)
  const years = date.getUTCFullYear()
  const hours = date.getUTCHours()
  return { days, years, hours }
}

function getPathsForDuration(start, end) {
  const st2 = new Date(start).getTime()
  const end2 = new Date(end).getTime()
  for (let t = st2; st2 <= end; t += 1000 * 60 * 60) {
    const t2 = new Date(t)
    const datePath = getDatePath(t2)

  }
}
