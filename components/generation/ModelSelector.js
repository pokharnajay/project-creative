'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploadBox from './ImageUploadBox';
import Image from 'next/image';

// Default models from stock folder
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

  // Update parent when selection changes
  useEffect(() => {
    if (mode === 'default') {
      onSelect(DEFAULT_MODELS[selectedModelIndex].src);
    } else {
      onSelect(customImage);
    }
  }, [mode, selectedModelIndex, customImage, onSelect]);

  const handlePrevModel = () => {
    setSelectedModelIndex((prev) =>
      prev === 0 ? DEFAULT_MODELS.length - 1 : prev - 1
    );
  };

  const handleNextModel = () => {
    setSelectedModelIndex((prev) =>
      prev === DEFAULT_MODELS.length - 1 ? 0 : prev + 1
    );
  };

  const handleCustomUpload = (url) => {
    setCustomImage(url);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Model Image (Optional)
      </label>

      {/* Mode Selector Dropdown */}
      <div className="mb-4">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all cursor-pointer bg-white"
        >
          <option value="default">Use Default Model</option>
          <option value="custom">Upload Custom Model</option>
        </select>
      </div>

      {/* Content based on mode */}
      <AnimatePresence mode="wait">
        {mode === 'default' ? (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Model Display */}
            <div className="relative border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-center gap-4">
                {/* Left Arrow */}
                <button
                  onClick={handlePrevModel}
                  className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
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

                {/* Model Image */}
                <div className="relative w-48 h-64 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={DEFAULT_MODELS[selectedModelIndex].src}
                    alt={DEFAULT_MODELS[selectedModelIndex].name}
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>

                {/* Right Arrow */}
                <button
                  onClick={handleNextModel}
                  className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
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

              {/* Model Counter */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  {DEFAULT_MODELS[selectedModelIndex].name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedModelIndex + 1} / {DEFAULT_MODELS.length}
                </p>
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-1.5 mt-3">
                {DEFAULT_MODELS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedModelIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      index === selectedModelIndex
                        ? 'bg-gray-900 w-4'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
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
  );
}
