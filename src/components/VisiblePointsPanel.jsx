import { useState } from 'react';

export default function VisiblePointsPanel({
  points = [],
  onPointHover,
  onPointClick,
  hoveredPointId
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter points by search query
  const filteredPoints = points.filter(point =>
    point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (point.groupName && point.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group points by their group
  const groupedPoints = filteredPoints.reduce((acc, point) => {
    const groupName = point.groupName || 'Інше';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(point);
    return acc;
  }, {});

  if (isCollapsed) {
    return (
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          title="Показати панель точок"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {points.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {points.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg w-72 max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Точки на екрані</span>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {filteredPoints.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Згорнути"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-100">
        <input
          type="text"
          placeholder="Пошук точок..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Points list */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedPoints).length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchQuery ? 'Нічого не знайдено' : 'Немає видимих точок'}
          </div>
        ) : (
          Object.entries(groupedPoints).map(([groupName, groupPoints]) => (
            <div key={groupName} className="border-b border-gray-100 last:border-b-0">
              {/* Group header */}
              <div className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
                {groupName} ({groupPoints.length})
              </div>
              {/* Points in group */}
              {groupPoints.map((point) => (
                <div
                  key={point.id}
                  className={`px-3 py-2 cursor-pointer transition-colors border-l-3 ${
                    hoveredPointId === point.id
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                  style={{ borderLeftWidth: '3px', borderLeftColor: hoveredPointId === point.id ? point.color : 'transparent' }}
                  onMouseEnter={() => onPointHover?.(point.id)}
                  onMouseLeave={() => onPointHover?.(null)}
                  onClick={() => onPointClick?.(point)}
                >
                  <div className="flex items-center gap-2">
                    {point.icon ? (
                      <span
                        className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: point.color || '#666',
                          color: 'white',
                          fontSize: point.icon.length === 1 ? '10px' : '12px'
                        }}
                      >
                        {point.icon}
                      </span>
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: point.color || '#666' }}
                      />
                    )}
                    <span className="text-sm text-gray-700 truncate">{point.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
        Наведіть для підсвітки • Клік для центрування
      </div>
    </div>
  );
}
