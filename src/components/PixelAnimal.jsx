import { spriteRows, spriteColor } from "../data/pixelAnimals.js";

// One 16x16 pixel animal as crisp SVG squares (scales to any size without blur).
export default function PixelAnimal({ animal, size = 96 }) {
  const rects = [];
  spriteRows(animal).forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={spriteColor(animal, ch)} />);
    }),
  );
  return (
    <svg className="pixel-animal" viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={animal.name}>
      {rects}
    </svg>
  );
}
