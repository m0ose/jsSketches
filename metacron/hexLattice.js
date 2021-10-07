
export class HexLattice {
  constructor(width, height, DataType = Int32Array) {
    this.grid = new DataType(2 * width * height)
    this.width = width
    this.height = height
  }

  /**
   * 
   * Get value at Hex x,y
   * 
   *   / \ / \ / \
   *  |0,1|1,1|2,1| ...
   * / \ / \ / \ /
   *|0,0|1,0|1,0| ...
   * \ / \ / \ /
   * 
   * @param {Int} x 
   * @param {Int} y 
   * @returns {*} value
   */
  getGridXY(x, y) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
      return this.grid[this.xYToGridIndex(x, y)]
    }
    return undefined
  }

  /**
   * Set value at xy
   * @param {Int} x 
   * @param {Int} y 
   * @param {*} value 
   */
  setGridXY(x, y, value) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
      this.grid[this.xYToGridIndex(x, y)] = value
    }
  }

  neighbors6Coords(x, y) {
    const rX = Math.abs(y % 2)
    return [[rX + x - 1, y + 1], [rX + x, y + 1],
     [x + 1, y],
    [rX + x, y - 1], [rX + x - 1, y - 1], [x - 1, y] ]
  }

  /**
   * Get [x,y,value] of your six neightbors
   * @param {Int} x 
   * @param {Int} y 
   * @returns Array of [x,y,value]
   */
  neighbors6(x, y) {
    return this.neighbors6Coords(x, y).map((coord) => {
      const [xn, yn] = coord
      return [xn, yn, this.getGridXY(xn, yn)]
    })
  }

  xYToGridIndex(x, y) {
    const rX = Math.abs(y % 2)
    const x2 = 2 * x + rX
    const y2 = y
    const index = y2 * this.width + x2
    return index
  }

  /**
   * Clone
   * @returns {HexLattice}
   */
  clone() {
    const neyHex = new HexLattice(this.width, this.height, this.grid.constructor)
    for (let i = 0; i < this.grid.length; i++) {
      neyHex.grid[i] = this.grid[i]
    }
    return neyHex
  }

  /**
   * Euclidean coordinates where each hexagon is 2 units across.
   * @param {*} x 
   * @param {*} y 
   * @returns [x,y]
   */
  GridXYToEuclidean(x, y) {
    return GridXYToEuclidean(x, y)
  }

  stamp(coords, value = 1) {
    coords.forEach((coord) => {
      const [x, y] = coord
      this.setGridXY(x, y, value)
    })
  }

  /**
   * iterate through every patch
   * @param {function} f callback f(val,x,y) 
   */
  forEach(f) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const val = this.getGridXY(x, y)
        f(val, x, y)
      }
    }
  }
}

/**
  * Euclidean coordinates where each hexagon is 2 units across.
  * @param {*} x 
  * @param {*} y 
  * @returns [x,y]
  */
export function GridXYToEuclidean(x, y) {
  const rX = Math.abs(y % 2)
  return [(2 * x + rX), y * Math.sqrt(3)]
}
