'use client';

import { motion } from 'framer-motion';

export default function LandingFooter() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800 min-h-[25vh] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-8"
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-semibold text-white">
              ImageGen
            </span>
          </motion.div>

          {/* Description */}
          <motion.p variants={itemVariants} className="text-gray-400 text-sm max-w-md">
            Transform your product photography with AI. Create stunning professional images in seconds.
          </motion.p>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 pt-8 border-t border-gray-800"
        >
          <p className="text-gray-500 text-sm text-center">
            &copy; 2025 AI ImageGen. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
