'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploadBox from './ImageUploadBox';
import Image from 'next/image';

// Default models from models folder
const DEFAULT_MODELS = [
  { id: 1, src: '/models/Model1.jpeg', name: 'Model 1' },
  { id: 2, src: '/models/Model2.jpeg', name: 'Model 2' },
  { id: 3, src: '/models/Model3.jpeg', name: 'Model 3' },
  { id: 4, src: '/models/Model4.jpeg', name: 'Model 4' },
  { id: 5, src: '/models/Model5.jpeg', name: 'Model 5' },
  { id: 6, src: '/models/Model6.jpeg', name: 'Model 6' },
  { id: 7, src: '/models/Model7.jpeg', name: 'Model 7' },
  { id: 8, src: '/models/Model8.jpeg', name: 'Model 8' },
  { id: 9, src: '/models/Model9.jpeg', name: 'Model 9' },
];

export default function ModelSelector({ onSelect, existingImage }) {
  const [mode, setMode] = useState('default'); // 'default' or 'custom'
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [customImage, setCustomImage] = useState(existingImage || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0); // -1 for left, 1 for right
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update parent when selection changes
  useEffect(() => {
    if (mode === 'default') {
      onSelect(DEFAULT_MODELS[selectedModelIndex].src);
    } else {
      onSelect(customImage);
    }
  }, [mode, selectedModelIndex, customImage, onSelect]);

  const handlePrevModel = () => {
    setSlideDirection(-1);
    setSelectedModelIndex((prev) =>
      prev === 0 ? DEFAULT_MODELS.length - 1 : prev - 1
    );
  };

  const handleNextModel = () => {
    setSlideDirection(1);
    setSelectedModelIndex((prev) =>
      prev === DEFAULT_MODELS.length - 1 ? 0 : prev + 1
    );
  };

  const handleCustomUpload = (url) => {
    setCustomImage(url);
  };

  const handleModeSelect = (newMode) => {
    setMode(newMode);
    setIsDropdownOpen(false);
  };

  // Slide animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full h-full flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Model Image (Optional)
      </label>

      {/* Custom Styled Dropdown */}
      <div className="relative mb-4" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'default' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {mode === 'default' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <span className="text-gray-900 font-medium">
              {mode === 'default' ? 'Default Model' : 'Custom Upload'}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
            >
              <button
                onClick={() => handleModeSelect('default')}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                  mode === 'default' ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mode === 'default' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-gray-900 font-medium">Default Model</p>
                  <p className="text-xs text-gray-500">Choose from our library</p>
                </div>
                {mode === 'default' && (
                  <svg className="w-5 h-5 text-gray-900 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => handleModeSelect('custom')}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                  mode === 'custom' ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mode === 'custom' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-gray-900 font-medium">Custom Upload</p>
                  <p className="text-xs text-gray-500">Upload your own model</p>
                </div>
                {mode === 'custom' && (
                  <svg className="w-5 h-5 text-gray-900 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content based on mode */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {mode === 'default' ? (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* Model Display */}
              <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50/50 h-full min-h-[280px] flex flex-col">
                <div className="flex items-center justify-center gap-4 flex-1">
                  {/* Left Arrow */}
                  <button
                    onClick={handlePrevModel}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Model Image with slide animation */}
                  <div className="relative w-44 h-56 rounded-xl overflow-hidden shadow-lg">
                    <AnimatePresence mode="wait" custom={slideDirection}>
                      <motion.div
                        key={selectedModelIndex}
                        custom={slideDirection}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={DEFAULT_MODELS[selectedModelIndex].src}
                          alt={DEFAULT_MODELS[selectedModelIndex].name}
                          fill
                          className="object-cover"
                          sizes="176px"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={handleNextModel}
                    className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Model Info & Dots */}
                <div className="mt-4">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      {DEFAULT_MODELS[selectedModelIndex].name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedModelIndex + 1} / {DEFAULT_MODELS.length}
                    </p>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex justify-center gap-1.5">
                    {DEFAULT_MODELS.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSlideDirection(index > selectedModelIndex ? 1 : -1);
                          setSelectedModelIndex(index);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          index === selectedModelIndex
                            ? 'bg-gray-900 w-6'
                            : 'bg-gray-300 hover:bg-gray-400 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ImageUploadBox
                label=""
                onUpload={handleCustomUpload}
                existingImage={customImage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
