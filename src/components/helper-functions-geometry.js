export const divideLine = (x1, y1, x2, y2, ratio) => [
    x1 + ratio * (x2 - x1),
    y1 + ratio * (y2 - y1)
  ]

export const partitionLine = (x1, y1, x2, y2, parts) =>
  Array.from({ length: parts + 1 })
    .map((_, i) => divideLine(x1, y1, x2, y2, i / parts))
    .reduce((acc, v, i, src) => {
      if (i === 0) return acc;

      return [...acc, [src[i - 1], v]];
    }, [])

