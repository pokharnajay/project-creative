'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/Modal';

export default function ImageCard({ image, onDelete, onMoveToFolder }) {
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
      <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all">
        <div className="relative">
          <img
            src={image.url}
            alt={image.prompt || 'Generated image'}
            className="w-full h-auto object-cover cursor-pointer"
            onClick={() => setShowDetails(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
              title="View details"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
              title="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-700"
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
              className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors shadow-sm text-red-500 cursor-pointer"
              title="Delete"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {image.prompt && (
          <div className="p-4">
            <p className="text-sm text-gray-600 line-clamp-2">{image.prompt}</p>
            <p className="text-xs text-gray-400 mt-2">
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
          <p>Are you sure you want to delete this image? This action cannot be undone.</p>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
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
          <img src={image.url} alt="Full size" className="w-full rounded-xl mb-6" />
          <div className="space-y-4">
            {image.prompt && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Prompt</p>
                <p className="text-sm text-gray-700">{image.prompt}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm text-gray-700 capitalize">
                  {image.generation_type?.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Credits Used</p>
                <p className="text-sm text-gray-700">{image.credits_used}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-gray-700">
                {format(new Date(image.created_at), 'PPpp')}
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDetails(false)}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            Download
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
