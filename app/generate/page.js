'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/dashboard/Navbar';
import ImageUploadBox from '@/components/generation/ImageUploadBox';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Loader from '@/components/ui/Loader';

export default function GeneratePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [productImage, setProductImage] = useState(null);
  const [modelImage, setModelImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [numVariations, setNumVariations] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!productImage) {
      setError('Please upload a product image');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          productImageUrl: productImage,
          modelImageUrl: modelImage,
          numVariations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      setGeneratedImages(data.images);

      // Show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error generating images:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate AI Images</h1>
          <p className="text-gray-600">
            Upload your product and optionally a model to create professional advertising images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Images</CardTitle>
                <CardDescription>
                  Upload a product image and optionally a model image for combined shots
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ImageUploadBox
                    label="Product Image *"
                    onUpload={setProductImage}
                    existingImage={productImage}
                  />
                  <ImageUploadBox
                    label="Model Image (Optional)"
                    onUpload={setModelImage}
                    existingImage={modelImage}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Variations
                    </label>
                    <select
                      value={numVariations}
                      onChange={(e) => setNumVariations(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 image (5 credits)</option>
                      <option value={2}>2 images (10 credits)</option>
                      <option value={3}>3 images (15 credits)</option>
                      <option value={4}>4 images (20 credits)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt *
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the style, setting, and mood for your image. E.g., 'Professional studio lighting, modern minimalist background, fashion magazine style'"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={5}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={!productImage || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    Generate Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Generated Images</CardTitle>
                <CardDescription>Your generated images will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader size="lg" />
                    <p className="mt-4 text-gray-600">Generating your images...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take up to 60 seconds</p>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        Successfully generated {generatedImages.length} image(s)!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Redirecting to dashboard...
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {generatedImages.map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full rounded-lg shadow-md"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg
                      className="w-16 h-16 mb-4"
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
                    <p>No images generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
