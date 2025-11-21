'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SAMPLE_IMAGES = [
  { id: 1, color: 'from-purple-400 to-pink-500', title: 'Fashion Lookbook' },
  { id: 2, color: 'from-blue-400 to-cyan-500', title: 'Product Showcase' },
  { id: 3, color: 'from-green-400 to-emerald-500', title: 'Brand Campaign' },
  { id: 4, color: 'from-orange-400 to-red-500', title: 'Studio Shoot' },
  { id: 5, color: 'from-indigo-400 to-purple-500', title: 'Editorial Style' },
  { id: 6, color: 'from-pink-400 to-rose-500', title: 'Lifestyle Shot' },
  { id: 7, color: 'from-teal-400 to-blue-500', title: 'Commercial Ad' },
  { id: 8, color: 'from-yellow-400 to-orange-500', title: 'Creative Concept' },
];

function CarouselRow({ images, direction = 'left', speed = 20 }) {
  const rowRef = useRef();

  useEffect(() => {
    const row = rowRef.current;
    const totalWidth = row.scrollWidth / 2;

    gsap.to(row, {
      x: direction === 'left' ? -totalWidth : totalWidth,
      duration: speed,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
      },
    });
  }, [direction, speed]);

  const doubledImages = [...images, ...images];

  return (
    <div className="overflow-hidden py-4">
      <div ref={rowRef} className="flex gap-6" style={{ width: 'fit-content' }}>
        {doubledImages.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden group cursor-pointer"
          >
            <div
              className={`w-full h-full bg-gradient-to-br ${image.color} flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105`}
            >
              <div className="text-white text-center p-8">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">{image.title}</h3>
                <p className="text-sm mt-2 opacity-90">AI Generated</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InfiniteCarousel() {
  return (
    <div className="w-full space-y-4">
      <CarouselRow images={SAMPLE_IMAGES.slice(0, 4)} direction="left" speed={25} />
      <CarouselRow images={SAMPLE_IMAGES.slice(2, 6)} direction="right" speed={30} />
      <CarouselRow images={SAMPLE_IMAGES.slice(4, 8)} direction="left" speed={28} />
    </div>
  );
}
