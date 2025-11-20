'use client';

import { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import ImageCard from './ImageCard';
import Loader from '@/components/ui/Loader';

export default function ImageGrid({ folderId = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [folderId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const url = folderId
        ? `/api/images?folderId=${folderId}`
        : '/api/images';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      const response = await fetch(`/api/images?id=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setImages(images.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleMoveToFolder = async (imageId, folderId) => {
    try {
      const response = await fetch('/api/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, folderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to move image');
      }

      // Refresh images
      fetchImages();
    } catch (err) {
      console.error('Error moving image:', err);
      alert('Failed to move image');
    }
  };

  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 2,
    768: 1,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600 text-lg">No images yet</p>
        <p className="text-gray-500 text-sm mt-2">Generate your first AI image to get started</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {images.map((image) => (
        <div key={image.id} className="mb-4">
          <ImageCard
            image={image}
            onDelete={handleDelete}
            onMoveToFolder={handleMoveToFolder}
          />
        </div>
      ))}
    </Masonry>
  );
}
