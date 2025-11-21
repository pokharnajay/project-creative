'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/Modal';

export default function ImageCard({ image, onDelete, onMoveToFolder }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
        <div className="relative">
          <img
            src={image.url}
            alt={image.prompt || 'Generated image'}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              title="View details"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              title="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors text-red-600"
              title="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {image.prompt && (
          <div className="p-3">
            <p className="text-sm text-gray-600 line-clamp-2">{image.prompt}</p>
            <p className="text-xs text-gray-400 mt-1">
              {format(new Date(image.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader>
          <ModalTitle>Delete Image</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">Are you sure you want to delete this image? This action cannot be undone.</p>
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete(image.id);
              setShowDeleteModal(false);
            }}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)}>
        <ModalHeader>
          <ModalTitle>Image Details</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <img src={image.url} alt="Full size" className="w-full rounded-lg mb-4" />
          <div className="space-y-2">
            {image.prompt && (
              <div>
                <p className="text-sm font-medium text-gray-700">Prompt:</p>
                <p className="text-sm text-gray-600">{image.prompt}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Type:</p>
              <p className="text-sm text-gray-600 capitalize">
                {image.generation_type?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Created:</p>
              <p className="text-sm text-gray-600">
                {format(new Date(image.created_at), 'PPpp')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Credits Used:</p>
              <p className="text-sm text-gray-600">{image.credits_used}</p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
