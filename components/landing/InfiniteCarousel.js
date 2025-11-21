'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

// Generate array of 30 stock images
const STOCK_IMAGES = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  src: `/stock/${i + 1}.jpg`,
  alt: `Product ${i + 1}`,
}));

function CarouselRow({ images, direction = 'left', speed = 25 }) {
  const rowRef = useRef();
  const animationRef = useRef();

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    // Calculate total width of one set of images
    const firstChild = row.firstChild;
    if (!firstChild) return;

    const gap = 24; // 6 in Tailwind = 24px
    const cardWidth = 320; // w-80 = 320px
    const totalWidth = (cardWidth + gap) * images.length;

    // Set initial position for right direction to enable seamless loop
    if (direction === 'right') {
      gsap.set(row, { x: -totalWidth });
    }

    // Start animation with proper infinite loop
    animationRef.current = gsap.to(row, {
      x: direction === 'left' ? -totalWidth : 0,
      duration: speed,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          const numX = parseFloat(x);
          if (direction === 'left') {
            // Moving left: wrap from -totalWidth to 0
            return ((numX % totalWidth) + totalWidth) % totalWidth - totalWidth;
          } else {
            // Moving right: wrap from -totalWidth to 0
            return ((numX % totalWidth) - totalWidth) % totalWidth;
          }
        }),
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [images, direction, speed]);

  // Triple the images for seamless infinite loop
  const repeatedImages = [...images, ...images, ...images];

  return (
    <div className="overflow-hidden py-4">
      <div ref={rowRef} className="flex gap-6" style={{ willChange: 'transform' }}>
        {repeatedImages.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 w-80 h-64 rounded-xl  shadow-sm shadow-black overflow-hidden group cursor-pointer bg-gray-100"
          >
            <div className="w-full  h-full relative transform transition-transform duration-300 group-hover:scale-105">
              <Image
                src={image.src}
                alt={image.alt}
                width={320}
                className=""
                height={320}
                sizes="320px"
                onError={(e) => {
                  // Fallback to gradient if image not found
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }}
              />
              <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
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
      <CarouselRow images={STOCK_IMAGES.slice(0, 10)} direction="left" speed={40} />
      <CarouselRow images={STOCK_IMAGES.slice(10, 20)} direction="right" speed={45} />
      <CarouselRow images={STOCK_IMAGES.slice(20, 30)} direction="left" speed={42} />
    </div>
  );
}
