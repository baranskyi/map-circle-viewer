import { MASCOTS } from './VersionMascot';

// Version to mascot mapping (newest first)
const VERSION_HISTORY = [
  { version: '2.15.x', animal: 'puffin' },
  { version: '2.14.x', animal: 'okapi' },
  { version: '2.13.x', animal: 'narwhal' },
  { version: '2.12.x', animal: 'pangolin' },
  { version: '2.11.x', animal: 'axolotl' },
  { version: '2.10.1', animal: 'quokka' },
  { version: '2.10.0', animal: 'capybara' },
  { version: '2.9.x', animal: 'wombat' },
  { version: '2.8.x', animal: 'platypus' },
  { version: '2.7.x', animal: 'sloth' },
  { version: '2.6.x', animal: 'redpanda' },
  { version: '2.5.x', animal: 'hedgehog' },
  { version: '2.4.x', animal: 'otter' },
  { version: '2.3.x', animal: 'raccoon' },
  { version: '2.2.x', animal: 'koala' },
  { version: '2.1.x', animal: 'alpaca' },
  { version: '2.0.x', animal: 'llama' },
  { version: '1.0.x', animal: 'dodo' },
];

// Render a single mascot pixel art
function MascotPixelArt({ mascot, size = 80 }) {
  const pixelSize = size / 12;

  return (
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {mascot.pixels.map((row, y) =>
        row.map((colorIndex, x) =>
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
        )
      )}
    </div>
  );
}

export default function MascotGallery({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mascot Gallery</h2>
            <p className="text-sm text-gray-500">All version mascots since v1.0.0</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Закрити"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid of mascots */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {VERSION_HISTORY.map(({ version, animal }) => {
              const mascot = MASCOTS[animal];
              if (!mascot) return null;

              return (
                <div
                  key={animal}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <MascotPixelArt mascot={mascot} size={72} />
                  <div className="mt-2 text-center">
                    <div className="text-sm font-bold text-gray-700">{mascot.name}</div>
                    <div className="text-xs text-gray-400">v{version}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-center text-xs text-gray-400">
          {VERSION_HISTORY.length} versions • Click anywhere outside to close
        </div>
      </div>
    </div>
  );
}
