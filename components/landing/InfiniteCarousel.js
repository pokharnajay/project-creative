'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';

// Generate array of 22 stock images
const STOCK_IMAGES = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  src: `/stock/${i}.jpeg`,
  alt: `Product ${i}`,
}));

function CarouselRow({ images, direction = 'left', rowIndex = 0 }) {
  // Triple the images for seamless infinite loop visual
  const repeatedImages = [...images, ...images, ...images];

  return (
    <div className="overflow-hidden py-4">
      <div
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
                width={320}
                height={256}
                className="object-cover h-full w-full"
                sizes="320px"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB/wD/Z"
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
    // Register plugin inside useEffect to ensure it runs on client
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    if (!container) return;

    // Calculate dimensions
    const gap = 24; // 6 in Tailwind = 24px
    const cardWidth = 320; // w-80 = 320px
    const imagesPerRow = 7;
    const totalWidth = (cardWidth + gap) * imagesPerRow;

    // Get all carousel rows
    const row0 = container.querySelector('.carousel-row-0');
    const row1 = container.querySelector('.carousel-row-1');
    const row2 = container.querySelector('.carousel-row-2');

    if (!row0 || !row1 || !row2) return;

    // Set initial position for right direction to enable seamless loop
    gsap.set(row1, { x: -totalWidth });

    // Create scroll-triggered timeline with smooth scrubbing
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top bottom', // Start when top of container hits bottom of viewport
        end: 'bottom top', // End when bottom of container hits top of viewport
        scrub: 1.5, // Smooth scrubbing with 1.5 second lag
        // markers: true, // Debug markers enabled
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
      <CarouselRow images={STOCK_IMAGES.slice(0, 7)} direction="left" rowIndex={0} />
      <CarouselRow images={STOCK_IMAGES.slice(7, 14)} direction="right" rowIndex={1} />
      <CarouselRow images={STOCK_IMAGES.slice(14, 22)} direction="left" rowIndex={2} />
    </div>
  );
}
