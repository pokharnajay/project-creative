'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

const MODEL_IMAGES = [
  { id: 1, type: 'Full Length', color: 'from-purple-500 to-indigo-600', icon: '👤' },
  { id: 2, type: 'Waist Length', color: 'from-blue-500 to-cyan-600', icon: '👕' },
  { id: 3, type: 'Close Up', color: 'from-pink-500 to-rose-600', icon: '😊' },
  { id: 4, type: 'Left Profile', color: 'from-green-500 to-emerald-600', icon: '⬅️' },
  { id: 5, type: 'Right Profile', color: 'from-orange-500 to-red-600', icon: '➡️' },
];

export default function Model3DShowcase() {
  const [activeIndex, setActiveIndex] = useState(2);
  const containerRef = useRef();

  useEffect(() => {
    const cards = containerRef.current.querySelectorAll('.model-card');

    cards.forEach((card, index) => {
      const offset = index - activeIndex;
      const absOffset = Math.abs(offset);

      gsap.to(card, {
        x: offset * 280,
        z: -absOffset * 100,
        rotateY: offset * 15,
        scale: 1 - absOffset * 0.15,
        opacity: absOffset > 2 ? 0 : 1 - absOffset * 0.2,
        duration: 0.6,
        ease: 'power2.out',
      });
    });
  }, [activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : MODEL_IMAGES.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < MODEL_IMAGES.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '2000px' }}
      >
        {MODEL_IMAGES.map((model, index) => (
          <motion.div
            key={model.id}
            className="model-card absolute w-72 h-96 cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => setActiveIndex(index)}
            whileHover={{ scale: index === activeIndex ? 1.05 : 1 }}
          >
            <div
              className={`w-full h-full rounded-3xl bg-gradient-to-br ${model.color} shadow-2xl p-8 flex flex-col items-center justify-center text-white transform transition-all duration-300`}
              style={{
                boxShadow:
                  index === activeIndex
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="text-8xl mb-6">{model.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{model.type}</h3>
              <p className="text-sm opacity-90 text-center">
                Professional model shot {index + 1} of {MODEL_IMAGES.length}
              </p>
              {index === activeIndex && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                >
                  Active View
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={handleNext}
        className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {MODEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? 'bg-indigo-600 w-8' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
