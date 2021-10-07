import { GridXYToEuclidean } from './hexLattice.js'

function GridXYToCanvasCoords(xg, yg, radius, offsetX = 0, offsetY = 0) {
  const [x2, y2] = GridXYToEuclidean(xg, yg)
  return [x2 * radius + offsetX, y2 * radius + offsetY]
}

export function drawCircles(grid, ctx, radius, colorFunc = (v, x, y) => { return "#000000" }) {
  grid.forEach((v, x, y) => {
    if (v) {
      ctx.fillStyle = colorFunc(v, x, y);
      ctx.beginPath();
      const [xc, yc] = GridXYToCanvasCoords(x, y, radius)
      ctx.arc(xc, yc, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  })
}

export function drawLines(grid, ctx, radius) {
  const filled = []

  grid.forEach((v, x, y) => {
    if (v) {
      filled.push([x, y, v])
    }
  })

  filled.forEach((v1) => {
    const [x1, y1] = GridXYToCanvasCoords(v1[0], v1[1], radius)
    filled.forEach((v2) => {
      if (v1 !== v2) {
        const [x2, y2] = GridXYToCanvasCoords(v2[0], v2[1], radius)
        ctx.line
        ctx.beginPath()
        ctx.strokeStyle = "#77777722"
        ctx.lineWidth = 1
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    })
  })
}


/**
 * This is like a cellular automata on a hex grid
 * 
 * The only rule is that if there is one solid neighbor you yourself become solid
 */
export function iteration(grid, step) {
  const clonedGrid = grid.clone()
  grid.forEach((v, x, y) => {
    if (!v) {
      const neibs = grid.neighbors6(x, y)
      const solidNeibs = neibs.filter(x => x[2])
      if (solidNeibs.length == 1) {
        clonedGrid.stamp([[x, y]], step + 1)
      }
    }
  })
  return clonedGrid
}








