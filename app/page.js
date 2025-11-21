'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import InfiniteCarousel from '@/components/landing/InfiniteCarousel';
import Model3DShowcase from '@/components/landing/Model3DShowcase';

// Dynamically import 3D component (client-side only)
const RubiksCube3D = dynamic(() => import('@/components/landing/RubiksCube3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const heroRef = useRef();
  const featuresRef = useRef();
  const showcaseRef = useRef();
  const modelsRef = useRef();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    // Hero animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.hero-text'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );
    }

    // Features animation
    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.querySelectorAll('.feature-card'),
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Showcase section animation
    if (showcaseRef.current) {
      gsap.fromTo(
        showcaseRef.current.querySelector('.section-title'),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top 75%',
          },
        }
      );
    }

    // Models section animation
    if (modelsRef.current) {
      gsap.fromTo(
        modelsRef.current.querySelector('.section-content'),
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          scrollTrigger: {
            trigger: modelsRef.current,
            start: 'top 70%',
          },
        }
      );
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-800 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      <LandingHeader />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex items-center overflow-hidden bg-[rgba(0,0,0,0.13)]"
      >
        {/* Hero Content - Two Column Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-block px-6 py-2 bg-white border border-gray-200 rounded-full shadow-sm"
              >
                <span className="text-gray-700 font-medium">AI-Powered Image Generation</span>
              </motion.div>

              <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight text-nowrap">
                Visualize Beyond
                <br />
                <span className="text-gray-600">Reality</span>
              </h1>

              <p className="hero-text text-lg md:text-xl text-gray-600 max-w-xl">
                Transform ordinary product photos into extraordinary advertising campaigns with AI.
                <span className="block mt-3 text-gray-800 font-medium text-xl">
                  Professional. Stunning. Instant.
                </span>
              </p>

              <div className="hero-text flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth/signin')}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-4 shadow-lg"
                >
                  Start Creating Free
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const element = document.getElementById('showcase');
                    if (element) {
                      const yOffset = -80;
                      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="text-gray-700 border-gray-300 hover:border-gray-900 text-lg px-8 py-4"
                >
                  View Examples
                </Button>
              </div>

              {/* Stats */}
              {/* <div className="hero-text flex gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600 mt-1">Images Generated</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600 mt-1">Happy Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600 mt-1">Model Poses</div>
                </div>
              </div> */}
            </div>

            {/* Right Side - Interactive 3D Rubik's Cube */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="relative w-full h-[600px] lg:h-[700px]">
                <RubiksCube3D />

                {/* Floating hint text */}
                {/* <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-700 font-medium">
                    🖱️ Drag to rotate • Hover to interact
                  </span>
                </motion.div> */}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="flex items-center justify-center min-h-[100vh] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create professional product imagery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card group">
              <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Product Solo Shots</h3>
                <p className="text-gray-600">
                  Upload your product and generate professional advertising images with custom backgrounds, lighting, and styles in seconds.
                </p>
              </div>
            </div>

            <div className="feature-card group">
              <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Product + Model</h3>
                <p className="text-gray-600">
                  Combine your products with professional models to create stunning lifestyle and fashion campaign images effortlessly.
                </p>
              </div>
            </div>

            <div className="feature-card group">
              <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Organization</h3>
                <p className="text-gray-600">
                  Organize images in custom folders with our Pinterest-style dashboard. Manage, download, and share with ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Carousel Section */}
      <section id="showcase" ref={showcaseRef} className="flex item-center justify-center py-5  bg-[rgba(0,0,0,0.13)] overflow-hidden">
        {/* <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
          <h2 className="section-title text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Stunning Results, Every Time
          </h2>
          <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto">
            {`See what's possible with AI-powered image generation`}
          </p>
        </div> */}

        <InfiniteCarousel />
      </section>

      {/* Model Showcase Section */}
      <section id="models" ref={modelsRef} className="py-24 bg-white ">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="section-content">
            <Model3DShowcase />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24  bg-[rgba(0,0,0,0.13)] relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Product Photography?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join thousands of creators and businesses using AI to create stunning visuals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth/signin')}
                className="bg-gray-800 text-white hover:bg-gray-950 text-lg px-10 py-4"
              >
                Start Free Trial
              </Button>
              {/* <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-10 py-4"
              >
                View Pricing
              </Button> */}
            </div>
            {/* <p className="text-gray-400 mt-6">No credit card required • 100 free credits • Cancel anytime</p> */}
            <p className="text-gray-800 mt-6 font-medium">No credit card required • 100 free credits</p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
