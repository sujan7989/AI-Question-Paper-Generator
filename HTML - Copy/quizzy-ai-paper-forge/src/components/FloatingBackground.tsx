import React, { useEffect, useState } from 'react';

interface FloatingItem {
  id: number;
  icon: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

// Only academic/relevant icons, fewer and subtler
const icons = ['📄', '📚', '✏️', '🎓', '📝', '🔬', '📊', '💡', '🎯', '📐'];

const FloatingBackground = () => {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const generated: FloatingItem[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      icon: icons[i % icons.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 18 + Math.random() * 22,
      opacity: 0.06 + Math.random() * 0.10,
      duration: 18 + Math.random() * 14,
      delay: Math.random() * 8,
    }));
    setItems(generated);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {items.map(item => (
        <div
          key={item.id}
          className="absolute animate-float-smooth select-none"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default FloatingBackground;
