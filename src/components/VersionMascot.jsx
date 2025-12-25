// Version mascot pixel art component
// VERSIONING RULES:
// - Animal name changes only on MINOR version bump (2.12.x -> 2.13.0)
// - Patch versions keep the same animal (2.12.1, 2.12.2 = same animal)
// - Each minor version gets a unique meme animal name

// Pixel art data: 12x12 grid, each number is a color index
const MASCOTS = {
  pangolin: {
    name: 'Pangolin',
    emoji: '🦔',
    colors: ['transparent', '#8B4513', '#D2691E', '#000000', '#FFE4C4'],
    pixels: [
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,1,2,2,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,1,2,2,1,2,1,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,1,2,1,2,1,2,1,2,1,1,0],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,2,1,2,1,2,1,2,1,1],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,1,2,2,2,2,1,1,0,0],
      [0,0,0,1,3,1,1,3,1,0,0,0],
      [0,0,0,0,1,0,0,1,0,0,0,0],
    ]
  },
  axolotl: {
    name: 'Axolotl',
    emoji: '🦎',
    colors: ['transparent', '#FFB6C1', '#FF69B4', '#000000', '#FFFFFF'],
    pixels: [
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,1,2,2,1,0,0,1,2,2,1,0],
      [1,2,2,2,2,1,1,2,2,2,2,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,3,4,1,1,4,3,1,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,0,0,1,1,1,1,0,0,1,1],
      [1,0,0,0,0,1,1,0,0,0,0,1],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ]
  },
  quokka: {
    name: 'Quokka',
    emoji: '🐹',
    colors: ['transparent', '#8B7355', '#A0522D', '#000000', '#FFF8DC'],
    pixels: [
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,1,2,2,1,0,0,1,2,2,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,3,4,1,1,1,1,4,3,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,4,1,1,4,1,1,1,1],
      [0,1,1,1,4,4,4,4,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,0,0,0,0,1,0,0,0],
      [0,0,0,1,0,0,0,0,1,0,0,0],
    ]
  },
  capybara: {
    name: 'Capybara',
    emoji: '🦫',
    colors: ['transparent', '#8B4513', '#A0522D', '#000000', '#FFE4C4'],
    pixels: [
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,1,2,3,4,2,2,4,3,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,1,2,2,2,1,1,2,2,2,1,0],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,0,1,0,0,0,0,0,0,1,0,0],
      [0,0,1,0,0,0,0,0,0,1,0,0],
    ]
  }
};

// Extract animal name from version string
function getAnimalFromVersion(version) {
  const match = version.match(/\((\w+)\)/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return 'pangolin'; // default
}

export default function VersionMascot({ version }) {
  const animalName = getAnimalFromVersion(version);
  const mascot = MASCOTS[animalName];

  if (!mascot) {
    // Fallback to emoji if no pixel art exists
    return (
      <div className="flex flex-col items-center mt-2">
        <div className="text-4xl">{Object.values(MASCOTS)[0]?.emoji || '🐾'}</div>
        <div className="text-xs text-gray-400 mt-1">{animalName}</div>
      </div>
    );
  }

  const pixelSize = 10; // 10px per pixel = 120px total

  return (
    <div className="flex flex-col items-center mt-2">
      <div
        className="relative"
        style={{
          width: `${pixelSize * 12}px`,
          height: `${pixelSize * 12}px`
        }}
        title={mascot.name}
      >
        {mascot.pixels.map((row, y) => (
          row.map((colorIndex, x) => (
            colorIndex !== 0 && (
              <div
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: `${x * pixelSize}px`,
                  top: `${y * pixelSize}px`,
                  width: `${pixelSize}px`,
                  height: `${pixelSize}px`,
                  backgroundColor: mascot.colors[colorIndex],
                }}
              />
            )
          ))
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-1 font-medium">{mascot.name}</div>
    </div>
  );
}
