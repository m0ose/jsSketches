/**
 * Run n async functions simultaniously
 *
 * @param {array} asyncFunctions
 * @param {int} limit
 * @returns {array} similiar to Promise.allSettled
 */
function runN(asyncFunctions, limit) {
  return new Promise((resolve, reject) => {
    let i = 0
    let inProgress = 0
    const result = new Array(asyncFunctions.length)
    function run() {
      if (inProgress <= 0 && i >= asyncFunctions.length - 1) {
        resolve(result)
      }
      while (inProgress < limit && i < asyncFunctions.length) {
        const f = asyncFunctions[i]
        const i2 = i
        ++inProgress

        f()
          .then((...values) => {
            result[i2] = {
              status: 'fullfilled',
              values,
            }
            --inProgress
            run()
          })
          .catch((err) => {
            result[i2] = {
              status: 'rejected',
              reason: err,
            }
            --inProgress
            run()
          })
        i++
      }
    }
    run()
  })
}
