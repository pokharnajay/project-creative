'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/utils/cn';
import Loader from '@/components/ui/Loader';

export default function ImageUploadBox({ onUpload, label, existingImage }) {
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
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer',
          isDragActive ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400',
          preview ? 'bg-gray-50' : 'bg-white'
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader size="lg" />
            <p className="mt-4 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
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
          <div className="flex flex-col items-center justify-center py-8">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 text-center">
              {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP up to 10MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
