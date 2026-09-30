import { rasterize, GRID } from "../data/pixelAnimals.js";

// One pixel animal as crisp SVG squares (scales to any size without blur).
// Runs of same-coloured pixels in a row are merged into one rect.
export default function PixelAnimal({ animal, size = 96 }) {
  const rects = [];
  rasterize(animal).forEach((row, y) => {
    let x = 0;
    while (x < GRID) {
      const c = row[x];
      let end = x + 1;
      while (end < GRID && row[end] === c) end++;
      if (c) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height="1" fill={c} />);
      x = end;
    }
  });
  return (
    <svg className="pixel-animal" viewBox={`0 0 ${GRID} ${GRID}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={animal.name}>
      {rects}
    </svg>
  );
}
