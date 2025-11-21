'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const MODEL_IMAGES = [
  { id: 1, type: 'Full Length', color: 'from-purple-500 to-indigo-600', icon: '👤' },
  { id: 2, type: 'Waist Length', color: 'from-blue-500 to-cyan-600', icon: '👕' },
  { id: 3, type: 'Close Up', color: 'from-pink-500 to-rose-600', icon: '😊' },
  { id: 4, type: 'Left Profile', color: 'from-green-500 to-emerald-600', icon: '⬅️' },
  { id: 5, type: 'Right Profile', color: 'from-orange-500 to-red-600', icon: '➡️' },
];

export default function Model3DShowcase() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    // Continuous scroll animation for infinite loop
    const models = container.querySelectorAll('.model-card');
    const totalWidth = 320; // Width of each card + gap

    // Clone models for infinite effect
    models.forEach((model) => {
      const clone = model.cloneNode(true);
      container.appendChild(clone);
    });

    gsap.to(container, {
      x: -totalWidth * MODEL_IMAGES.length,
      duration: 20,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          return parseFloat(x) % (totalWidth * MODEL_IMAGES.length);
        }),
      },
    });
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-12">
      <div
        ref={containerRef}
        className="flex gap-8"
        style={{ width: 'fit-content' }}
      >
        {MODEL_IMAGES.map((model, index) => (
          <div
            key={model.id}
            className="model-card flex-shrink-0 w-80 h-96 cursor-pointer group"
          >
            <div
              className={`w-full h-full rounded-3xl bg-gradient-to-br ${model.color} shadow-2xl p-8 flex flex-col items-center justify-center text-white transform transition-all duration-300 hover:scale-105 hover:shadow-3xl`}
            >
              <div className="text-8xl mb-6 transform group-hover:scale-110 transition-transform">
                {model.icon}
              </div>
              <h3 className="text-2xl font-bold mb-2">{model.type}</h3>
              <p className="text-sm opacity-90 text-center">
                Professional model shot {index + 1} of {MODEL_IMAGES.length}
              </p>
              <div className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                View Sample
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Overlays for smooth edges */}
      <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
    </div>
  );
}
