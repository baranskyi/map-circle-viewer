// Pixel art logo for Map Circle Viewer
// 16x16 grid representing a map pin with circles

const LOGO_COLORS = [
  'transparent',      // 0
  '#3B82F6',          // 1 - Blue (primary)
  '#60A5FA',          // 2 - Light blue
  '#1D4ED8',          // 3 - Dark blue
  '#FFFFFF',          // 4 - White
  '#EF4444',          // 5 - Red (pin)
  '#DC2626',          // 6 - Dark red
  '#FCA5A5',          // 7 - Light red
];

// 16x16 pixel art - map pin with concentric circles
const LOGO_PIXELS = [
  [0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,5,7,7,7,7,5,0,0,0,0,0],
  [0,0,0,0,5,7,7,4,4,7,7,5,0,0,0,0],
  [0,0,0,5,7,7,4,6,6,4,7,7,5,0,0,0],
  [0,0,0,5,7,4,6,6,6,6,4,7,5,0,0,0],
  [0,0,0,5,7,4,6,6,6,6,4,7,5,0,0,0],
  [0,0,0,5,7,7,4,6,6,4,7,7,5,0,0,0],
  [0,0,0,0,5,7,7,4,4,7,7,5,0,0,0,0],
  [0,0,0,0,0,5,7,7,7,7,5,0,0,0,0,0],
  [0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0],
  [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0],
  [0,2,1,1,2,0,0,0,0,0,0,2,1,1,2,0],
  [2,1,3,3,1,2,0,0,0,0,2,1,3,3,1,2],
  [2,1,3,3,1,2,2,2,2,2,2,1,3,3,1,2],
  [0,2,1,1,2,1,1,1,1,1,1,2,1,1,2,0],
];

export default function PixelLogo({ size = 32 }) {
  const pixelSize = size / 16;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block'
      }}
      title="Map Circle Viewer"
    >
      {LOGO_PIXELS.map((row, y) =>
        row.map((colorIndex, x) => {
          if (colorIndex === 0) return null;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * pixelSize,
                top: y * pixelSize,
                width: pixelSize,
                height: pixelSize,
                backgroundColor: LOGO_COLORS[colorIndex],
              }}
            />
          );
        })
      )}
    </div>
  );
}
