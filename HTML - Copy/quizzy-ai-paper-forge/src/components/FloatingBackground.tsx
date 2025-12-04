import React, { useEffect, useState } from 'react';

interface FloatingItem {
  id: number;
  icon: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  opacity: number;
  animationType: 'float' | 'drift' | 'spiral' | 'wave';
  color: string;
}

const FloatingBackground = () => {
  const [items, setItems] = useState<FloatingItem[]>([]);

  const toolIcons = [
    { icon: '📄', color: 'text-blue-300' },
    { icon: '📚', color: 'text-green-300' },
    { icon: '✏️', color: 'text-yellow-300' },
    { icon: '🧮', color: 'text-purple-300' },
    { icon: '🎓', color: 'text-indigo-300' },
    { icon: '📝', color: 'text-pink-300' },
    { icon: '🔬', color: 'text-cyan-300' },
    { icon: '📊', color: 'text-orange-300' },
    { icon: '💡', color: 'text-amber-300' },
    { icon: '🎯', color: 'text-red-300' },
    { icon: '⚙️', color: 'text-gray-300' },
    { icon: '🔍', color: 'text-emerald-300' },
    { icon: '📐', color: 'text-teal-300' },
    { icon: '🧪', color: 'text-violet-300' },
    { icon: '📈', color: 'text-lime-300' },
    { icon: '📋', color: 'text-sky-300' },
    { icon: '🖊️', color: 'text-rose-300' },
    { icon: '📌', color: 'text-fuchsia-300' },
    { icon: '📎', color: 'text-slate-300' },
    { icon: '🗂️', color: 'text-zinc-300' },
    { icon: '📁', color: 'text-stone-300' },
    { icon: '💻', color: 'text-blue-400' },
    { icon: '🖥️', color: 'text-green-400' },
    { icon: '⌨️', color: 'text-yellow-400' },
    { icon: '🖱️', color: 'text-purple-400' },
    { icon: '🎨', color: 'text-pink-400' },
    { icon: '🖌️', color: 'text-cyan-400' },
    { icon: '📏', color: 'text-orange-400' },
    { icon: '📐', color: 'text-amber-400' },
    { icon: '🔧', color: 'text-red-400' },
    { icon: '🔨', color: 'text-gray-400' },
    { icon: '⚡', color: 'text-yellow-200' },
    { icon: '🌟', color: 'text-amber-200' },
    { icon: '✨', color: 'text-pink-200' },
    { icon: '🎪', color: 'text-purple-200' },
    { icon: '🎭', color: 'text-indigo-200' },
    { icon: '🎪', color: 'text-cyan-200' },
    { icon: '🎨', color: 'text-emerald-200' },
    { icon: '🎯', color: 'text-lime-200' },
    { icon: '🎲', color: 'text-teal-200' },
  ];

  const animationTypes: FloatingItem['animationType'][] = ['float', 'drift', 'spiral', 'wave'];

  useEffect(() => {
    const generateItems = () => {
      const newItems: FloatingItem[] = [];
      for (let i = 0; i < 50; i++) {
        const toolIcon = toolIcons[Math.floor(Math.random() * toolIcons.length)];
        newItems.push({
          id: i,
          icon: toolIcon.icon,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 16 + Math.random() * 48,
          speed: 0.3 + Math.random() * 2,
          direction: Math.random() * 360,
          opacity: 0.15 + Math.random() * 0.35,
          animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)],
          color: toolIcon.color,
        });
      }
      setItems(newItems);
    };

    generateItems();
  }, []);

  const getAnimationClass = (animationType: FloatingItem['animationType']) => {
    switch (animationType) {
      case 'float':
        return 'animate-float-smooth';
      case 'drift':
        return 'animate-drift';
      case 'spiral':
        return 'animate-spiral';
      case 'wave':
        return 'animate-wave';
      default:
        return 'animate-float-smooth';
    }
  };

  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute transition-all duration-1000 ease-in-out ${getAnimationClass(item.animationType)} ${item.color} drop-shadow-lg`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              opacity: item.opacity,
              animationDelay: '0s',
              animationDuration: `${15 + Math.random() * 10}s`,
              transform: `rotate(${item.direction}deg)`,
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
    </>
  );
};

export default FloatingBackground;