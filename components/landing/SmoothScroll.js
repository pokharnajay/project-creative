'use client';

import { useEffect, useRef } from 'react';

export default function SmoothScroll({ children }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    let locomotiveScroll;

    const initScroll = async () => {
      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;

        locomotiveScroll = new LocomotiveScroll({
          el: scrollRef.current,
          smooth: true,
          smoothMobile: false,
          resetNativeScroll: true,
          tablet: {
            smooth: true,
          },
          smartphone: {
            smooth: false,
          },
        });

        // Update scroll on resize
        window.addEventListener('resize', () => {
          locomotiveScroll.update();
        });

        // Update on load
        window.addEventListener('load', () => {
          locomotiveScroll.update();
        });
      } catch (error) {
        console.error('Error initializing Locomotive Scroll:', error);
      }
    };

    initScroll();

    return () => {
      if (locomotiveScroll) {
        locomotiveScroll.destroy();
      }
    };
  }, []);

  return (
    <div data-scroll-container ref={scrollRef}>
      {children}
    </div>
  );
}
