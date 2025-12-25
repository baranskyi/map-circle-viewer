import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { userPreferencesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Default layer order
const DEFAULT_ORDER = [
  'metro',
  'malls',
  'fitness',
  'supermarkets',
  'kyivstarActive',
  'kyivstarTerminated',
  'apolloClubs'
];

// Layer configurations
const LAYER_CONFIG = {
  metro: {
    id: 'metro',
    label: '🚇 Метро Києва',
    colorDots: [
      { color: '#E4181C', title: 'М1 Червона' },
      { color: '#0072BC', title: 'М2 Синя' },
      { color: '#009E49', title: 'М3 Зелена' }
    ],
    accentColor: 'blue',
    hasRadius: true,
    hasOpacity: true
  },
  malls: {
    id: 'malls',
    label: '🏬 Торгові центри',
    colorDots: [{ color: '#9C27B0', title: 'ТЦ' }],
    accentColor: 'purple',
    hasRadius: true,
    hasOpacity: true
  },
  fitness: {
    id: 'fitness',
    label: '🏋️ Фітнес-клуби',
    colorDots: [{ color: '#4CAF50', title: 'Фітнес' }],
    accentColor: 'green',
    hasRadius: true,
    hasOpacity: true
  },
  supermarkets: {
    id: 'supermarkets',
    label: '🛒 Супермаркети',
    colorDots: [{ color: '#FF6B00', title: 'Супермаркети' }],
    accentColor: 'orange',
    hasRadius: true,
    hasOpacity: true
  },
  kyivstarActive: {
    id: 'kyivstarActive',
    label: '🟢 Kyivstar: Діючі клієнти',
    colorDots: [{ color: '#22c55e', title: 'Active clients' }],
    accentColor: 'green',
    hasRadius: false,
    hasOpacity: true,
    info: '390 гексагонів, 9190 клієнтів'
  },
  kyivstarTerminated: {
    id: 'kyivstarTerminated',
    label: '🔴 Kyivstar: Завершені клієнти',
    colorDots: [{ color: '#dc2626', title: 'Terminated clients' }],
    accentColor: 'red',
    hasRadius: false,
    hasOpacity: true,
    info: '878 гексагонів, 37605 клієнтів'
  },
  apolloClubs: {
    id: 'apolloClubs',
    label: '🏋️ APOLLO NEXT клуби',
    colorDots: [{ color: '#f97316', title: 'Apollo clubs' }],
    accentColor: 'orange',
    hasRadius: true,
    hasOpacity: true,
    info: '19 клубів у 6 містах'
  }
};

// Reorder helper
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export default function DraggableInfrastructure({
  // Visibility states
  showMetro, setShowMetro,
  showMalls, setShowMalls,
  showFitness, setShowFitness,
  showSupermarkets, setShowSupermarkets,
  showKyivstarActive, setShowKyivstarActive,
  showKyivstarTerminated, setShowKyivstarTerminated,
  showApolloClubs, setShowApolloClubs,
  // Radius states
  metroRadius, setMetroRadius,
  mallsRadius, setMallsRadius,
  fitnessRadius, setFitnessRadius,
  supermarketsRadius, setSupermarketsRadius,
  apolloClubsRadius, setApolloClubsRadius,
  // Opacity states
  metroOpacity, setMetroOpacity,
  mallsOpacity, setMallsOpacity,
  fitnessOpacity, setFitnessOpacity,
  supermarketsOpacity, setSupermarketsOpacity,
  kyivstarActiveOpacity, setKyivstarActiveOpacity,
  kyivstarTerminatedOpacity, setKyivstarTerminatedOpacity,
  apolloClubsOpacity, setApolloClubsOpacity
}) {
  const { user } = useAuthStore();
  const [layerOrder, setLayerOrder] = useState(DEFAULT_ORDER);

  // Load saved order on mount
  useEffect(() => {
    loadOrder();
  }, [user]);

  const loadOrder = async () => {
    if (user) {
      // Load from Supabase
      const savedOrder = await userPreferencesApi.get('infrastructure_order');
      if (savedOrder && Array.isArray(savedOrder)) {
        setLayerOrder(savedOrder);
      }
    } else {
      // Load from localStorage
      const saved = localStorage.getItem('infrastructure_order');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLayerOrder(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved order:', e);
        }
      }
    }
  };

  const saveOrder = async (newOrder) => {
    if (user) {
      // Save to Supabase
      try {
        await userPreferencesApi.set('infrastructure_order', newOrder);
      } catch (e) {
        console.error('Failed to save order:', e);
      }
    } else {
      // Save to localStorage
      localStorage.setItem('infrastructure_order', JSON.stringify(newOrder));
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = reorder(
      layerOrder,
      result.source.index,
      result.destination.index
    );

    setLayerOrder(newOrder);
    saveOrder(newOrder);
  };

  // Get state getters/setters for each layer
  const getLayerState = (layerId) => {
    switch (layerId) {
      case 'metro':
        return {
          show: showMetro, setShow: setShowMetro,
          radius: metroRadius, setRadius: setMetroRadius,
          opacity: metroOpacity, setOpacity: setMetroOpacity
        };
      case 'malls':
        return {
          show: showMalls, setShow: setShowMalls,
          radius: mallsRadius, setRadius: setMallsRadius,
          opacity: mallsOpacity, setOpacity: setMallsOpacity
        };
      case 'fitness':
        return {
          show: showFitness, setShow: setShowFitness,
          radius: fitnessRadius, setRadius: setFitnessRadius,
          opacity: fitnessOpacity, setOpacity: setFitnessOpacity
        };
      case 'supermarkets':
        return {
          show: showSupermarkets, setShow: setShowSupermarkets,
          radius: supermarketsRadius, setRadius: setSupermarketsRadius,
          opacity: supermarketsOpacity, setOpacity: setSupermarketsOpacity
        };
      case 'kyivstarActive':
        return {
          show: showKyivstarActive, setShow: setShowKyivstarActive,
          opacity: kyivstarActiveOpacity, setOpacity: setKyivstarActiveOpacity
        };
      case 'kyivstarTerminated':
        return {
          show: showKyivstarTerminated, setShow: setShowKyivstarTerminated,
          opacity: kyivstarTerminatedOpacity, setOpacity: setKyivstarTerminatedOpacity
        };
      case 'apolloClubs':
        return {
          show: showApolloClubs, setShow: setShowApolloClubs,
          radius: apolloClubsRadius, setRadius: setApolloClubsRadius,
          opacity: apolloClubsOpacity, setOpacity: setApolloClubsOpacity
        };
      default:
        return {};
    }
  };

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">
        Інфраструктура
      </h3>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="infrastructure-layers">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {layerOrder.map((layerId, index) => {
                const config = LAYER_CONFIG[layerId];
                const state = getLayerState(layerId);
                if (!config) return null;

                return (
                  <Draggable key={layerId} draggableId={layerId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`mb-2 pb-2 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0 ${
                          snapshot.isDragging ? 'bg-white rounded-lg shadow-lg p-2 -mx-2' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                            title="Перетягніть"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
                            </svg>
                          </div>

                          {/* Checkbox and label */}
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={state.show}
                              onChange={() => state.setShow(!state.show)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm flex items-center gap-1">
                              {config.label}
                              <span className="flex gap-0.5 ml-1">
                                {config.colorDots.map((dot, i) => (
                                  <span
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: dot.color }}
                                    title={dot.title}
                                  />
                                ))}
                              </span>
                            </span>
                          </label>
                        </div>

                        {/* Expanded controls when visible */}
                        {state.show && (
                          <div className="mt-2 ml-8">
                            {/* Info text */}
                            {config.info && (
                              <div className="text-xs text-gray-500 mb-2">{config.info}</div>
                            )}

                            {/* Radius controls */}
                            {config.hasRadius && state.setRadius && (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="2000"
                                    step="100"
                                    value={state.radius}
                                    onChange={(e) => state.setRadius(Math.min(2000, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                  />
                                  <span className="text-xs text-gray-500">м</span>
                                </div>
                                <div className="flex gap-1 mb-2">
                                  {[0, 500, 1000, 2000].map(r => (
                                    <button
                                      key={r}
                                      onClick={() => state.setRadius(r)}
                                      className={`px-2 py-0.5 text-xs rounded ${
                                        state.radius === r
                                          ? `bg-${config.accentColor}-500 text-white`
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                      style={state.radius === r ? {
                                        backgroundColor: config.colorDots[0].color,
                                        color: 'white'
                                      } : {}}
                                    >
                                      {r === 0 ? 'Вимк' : `${r}м`}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Opacity slider */}
                            {config.hasOpacity && state.setOpacity && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Яскравість:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={state.opacity}
                                  onChange={(e) => state.setOpacity(parseInt(e.target.value))}
                                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  style={{ accentColor: config.colorDots[0].color }}
                                />
                                <span className="text-xs text-gray-600 w-8">{state.opacity}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
