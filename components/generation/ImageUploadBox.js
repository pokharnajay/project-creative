'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/utils/cn';
import Loader from '@/components/ui/Loader';

export default function ImageUploadBox({ onUpload, label, existingImage, className }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(existingImage || null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        onUpload(data.url);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onUpload(null);
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all cursor-pointer flex-1 min-h-[280px]',
          isDragActive ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400',
          preview ? 'p-0 border-solid' : 'p-6 bg-white'
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-xl">
            <Loader size="lg" />
            <p className="mt-4 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full min-h-[280px]">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Remove button - top right corner */}
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-full transition-all cursor-pointer backdrop-blur-sm shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 text-center">
              {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
            </p>
            <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP up to 10MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
