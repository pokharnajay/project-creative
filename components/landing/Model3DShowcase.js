'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MODEL_POSES = [
  { id: 1, type: 'Full Length', position: 'top-0 left-0 z-10', rotation: '-rotate-3', size: 'w-48 h-64', link: 'Model3.jpeg' },
  { id: 2, type: 'Waist Length', position: 'top-8 left-32 z-20', rotation: 'rotate-2', size: 'w-44 h-60', link: 'Model9.jpeg' },
  { id: 3, type: 'Close Up', position: 'top-16 left-64 z-30', rotation: '-rotate-1', size: 'w-48 h-64', link: 'Model8.jpeg' },
  { id: 4, type: 'Left Profile', position: 'top-4 left-96 z-20', rotation: 'rotate-2', size: 'w-40 h-56', link: 'Model7.jpeg' },
  { id: 5, type: 'Right Profile', position: 'top-12 left-[29rem] z-10', rotation: 'rotate-3', size: 'w-44 h-60', link: 'Model2.jpeg' },
];

export default function Model3DShowcase() {
  const sectionRef = useRef();
  const imagesContainerRef = useRef();

  useEffect(() => {
    const section = sectionRef.current;
    const imagesContainer = imagesContainerRef.current;
    if (!section || !imagesContainer) return;

    // Get all model image elements
    const modelImages = imagesContainer.querySelectorAll('.model-image');
    if (modelImages.length === 0) return;

    // Set initial state - all images start small and transparent
    gsap.set(modelImages, {
      scale: 0.6,
      opacity: 0,
    });

    // Create a pinned timeline for the entire sequence
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top', // When the top of the section hits the top of the viewport
        end: '+=200%', // Pin for 200% of viewport height (gives time for all animations)
        pin: true,
        scrub: 1,
        // markers: true, // Uncomment to debug
      },
    });

    // Animate each image sequentially - scale up then slightly back
    modelImages.forEach((image, index) => {
      const startTime = index * 0.15; // Stagger start times

      // Scale up and fade in
      tl.to(image, {
        scale: 1.1,
        opacity: 1,
        duration: 0.12,
        ease: 'power2.out',
      }, startTime);

      // Scale back to normal
      tl.to(image, {
        scale: 1,
        duration: 0.08,
        ease: 'power2.inOut',
      }, startTime + 0.12);
    });

    // Hold at the end briefly before unpinning
    tl.to({}, { duration: 0.2 });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={sectionRef} className="w-full max-w-7xl mx-auto min-h-screen flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left Side - Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div>
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-4">
              Professional Models
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose From Our
              <span className="block text-gray-600 mt-2">Model Library</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Access our curated collection of professional models in various poses.
              Perfect for fashion, lifestyle, and product photography.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '📸', title: 'Multiple Angles', desc: 'Full length, waist, close-up, and profile shots' },
              { icon: '🎨', title: 'Diverse Selection', desc: 'Various styles and poses for every campaign' },
              { icon: '⚡', title: 'Instant Access', desc: 'No photoshoots needed - use immediately' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                {/* <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  {feature.icon}
                </div> */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 italic">
              Or upload your own model photos for personalized results
            </p>
          </div>
        </motion.div>

        {/* Right Side - Collaged Model Photos with GSAP Scroll Animation */}
        <div
          ref={imagesContainerRef}
          className="relative h-[500px] hidden lg:block mt-[10%]"
        >
          {MODEL_POSES.map((pose, index) => (
            <div
              key={pose.id}
              className={`model-image absolute ${pose.position} ${pose.size} ${pose.rotation} cursor-pointer group mt-14`}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="w-full h-full bg-gray-200 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center relative">
                  <Image
                    src={`/models/${pose.link}`}
                    width={192}
                    height={256}
                    alt={`Professional model - ${pose.type}`}
                    className="object-cover w-full h-full"
                    quality={90}
                    loading={index === 2 ? "eager" : "lazy"}
                    priority={index === 2}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB/wD/Z"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View - Simple Grid */}
        <div className="lg:hidden grid grid-cols-2 gap-4">
          {MODEL_POSES.slice(0, 4).map((pose) => (
            <div key={pose.id} className="bg-gray-200 rounded-xl h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/50 backdrop-blur-sm rounded-full mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium">{pose.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
