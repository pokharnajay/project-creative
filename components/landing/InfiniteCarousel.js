'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Generate array of 30 stock images
const STOCK_IMAGES = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  src: `/stock/${i + 1}.jpg`,
  alt: `Product ${i + 1}`,
}));

function CarouselRow({ images, direction = 'left', rowIndex = 0 }) {
  const rowRef = useRef();

  // Triple the images for seamless infinite loop visual
  const repeatedImages = [...images, ...images, ...images];

  return (
    <div className="overflow-hidden py-4">
      <div
        ref={rowRef}
        className={`carousel-row-${rowIndex} flex gap-6`}
        style={{ willChange: 'transform' }}
      >
        {repeatedImages.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 w-80 h-64 rounded-xl shadow-sm shadow-black overflow-hidden group cursor-pointer bg-gray-100"
          >
            <div className="w-full h-full relative transform transition-transform duration-300 group-hover:scale-105">
              <Image
                src={image.src}
                alt={image.alt}
                width={0}
                height={0}
                className="object-cover h-full w-full"
                sizes="320px"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InfiniteCarousel() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate dimensions
    const gap = 24; // 6 in Tailwind = 24px
    const cardWidth = 320; // w-80 = 320px
    const imagesPerRow = 10;
    const totalWidth = (cardWidth + gap) * imagesPerRow;

    // Get all carousel rows
    const row0 = container.querySelector('.carousel-row-0');
    const row1 = container.querySelector('.carousel-row-1');
    const row2 = container.querySelector('.carousel-row-2');

    if (!row0 || !row1 || !row2) return;

    // Set initial positions
    gsap.set(row0, { x: 0 });
    gsap.set(row1, { x: -totalWidth }); // Start offset for opposite direction
    gsap.set(row2, { x: 0 });

    // Create scroll-triggered timeline with smooth scrubbing
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top bottom', // Start when top of container hits bottom of viewport
        end: 'bottom top', // End when bottom of container hits top of viewport
        scrub: 1.5, // Smooth scrubbing with 1.5 second lag for ultra-smooth feel
        // markers: true, // Uncomment to debug
      },
    });

    // Animate each row - rows move in different directions
    // Row 0: moves left (negative x)
    tl.to(row0, {
      x: -totalWidth * 1.5,
      ease: 'none',
    }, 0);

    // Row 1: moves right (positive x) - starts from -totalWidth
    tl.to(row1, {
      x: totalWidth * 0.5,
      ease: 'none',
    }, 0);

    // Row 2: moves left (negative x) - slightly different speed
    tl.to(row2, {
      x: -totalWidth * 1.2,
      ease: 'none',
    }, 0);

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-4 overflow-hidden">
      <CarouselRow images={STOCK_IMAGES.slice(0, 10)} direction="left" rowIndex={0} />
      <CarouselRow images={STOCK_IMAGES.slice(10, 20)} direction="right" rowIndex={1} />
      <CarouselRow images={STOCK_IMAGES.slice(20, 30)} direction="left" rowIndex={2} />
    </div>
  );
}
