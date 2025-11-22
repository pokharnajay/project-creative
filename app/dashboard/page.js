'use client';

import { useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import FolderSidebar from '@/components/dashboard/FolderSidebar';
import ImageGrid from '@/components/dashboard/ImageGrid';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden pt-20">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Images</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  {selectedFolder === 'all'
                    ? 'All your generated images'
                    : 'Images in this folder'}
                </p>
              </div>
              <Button onClick={() => router.push('/generate')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Generate New
              </Button>
            </div>

            <ImageGrid folderId={selectedFolder} />
          </div>
        </main>
      </div>
    </div>
  );
}
