'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Trash2, Upload, Camera } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-fetch';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  photos: string[];
  onPhotosUpdate: (photos: string[]) => void;
  tier: string;
  uploadingPhoto: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerUpload: () => void;
}

export const PhotoGalleryModal = ({
  isOpen,
  onClose,
  businessId,
  photos,
  onPhotosUpdate,
  tier,
  uploadingPhoto,
  onPhotoUpload,
  onTriggerUpload
}: PhotoGalleryModalProps) => {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDeletePhoto = async (index: number) => {
    if (deletingIndex !== null) return; // Prevent multiple simultaneous deletions
    
    setDeletingIndex(index);
    try {
      const response = await authenticatedFetch(
        `/api/businesses/photos?businessId=${businessId}&photoIndex=${index}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();
      
      if (result.success) {
        // Remove photo from local state
        const updatedPhotos = photos.filter((_, i) => i !== index);
        onPhotosUpdate(updatedPhotos);
        
        // Show success message
        alert('Photo deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeletingIndex(null);
    }
  };

  const tierLimits = {
    silver: { maxPhotos: 5, maxSize: '2MB' },
    gold: { maxPhotos: 10, maxSize: '5MB' },
    platinum: { maxPhotos: 20, maxSize: '10MB' }
  };

  const currentLimit = tierLimits[tier as keyof typeof tierLimits];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Manage Business Photos
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {photos.length} of {currentLimit?.maxPhotos || 0} photos used
                {currentLimit && ` • Max ${currentLimit.maxSize} per photo`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Upload Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Upload className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-900">Add New Photo</h4>
                  <p className="text-sm text-blue-700">
                    Upload high-quality photos to showcase your business
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={onTriggerUpload}
                disabled={uploadingPhoto}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
              </Button>
            </div>
          </div>

          {/* Photo Grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={photo}
                      alt={`Business photo ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Handle broken images with a proper placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        
                        const container = target.parentElement;
                        if (container && !container.querySelector('.image-error-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'image-error-placeholder w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 text-center p-2';
                          placeholder.innerHTML = `<div><div class="text-3xl mb-2">🖼️</div><div class="text-xs">Image not available</div></div>`;
                          container.appendChild(placeholder);
                        }
                      }}
                      onLoad={() => {
                        // Image loaded successfully - could add success handler here
                        console.log(`Successfully loaded photo ${index + 1}`);
                      }}
                    />
                  </div>
                  
                  {/* Photo overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDeletePhoto(index)}
                        disabled={deletingIndex === index}
                        className="flex items-center bg-red-600 hover:bg-red-700 text-white shadow-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingIndex === index ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Always visible delete button in corner for better UX */}
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDeletePhoto(index)}
                      disabled={deletingIndex === index}
                      className="flex items-center bg-red-600 hover:bg-red-700 text-white w-8 h-8 p-0 rounded-full shadow-lg"
                      title="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Photo number badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {index === 0 ? 'Primary' : `Photo ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h4>
              <p className="text-gray-600 mb-4">
                Add photos to showcase your business and attract more customers
              </p>
              <Button
                variant="primary"
                onClick={onTriggerUpload}
                disabled={uploadingPhoto}
                className="flex items-center mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingPhoto ? 'Uploading...' : 'Upload First Photo'}
              </Button>
            </div>
          )}

          {/* Photo tips */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Photo Tips:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use high-quality images that showcase your business</li>
              <li>• The first photo will be used as your primary business image</li>
              <li>• Photos should be well-lit and professional looking</li>
              <li>• Show your products, services, or business location</li>
              {tier === 'silver' && <li>• Upgrade to Gold for more photos and larger file sizes</li>}
              {tier === 'gold' && <li>• Upgrade to Platinum for even more photos and logo support</li>}
            </ul>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            onChange={onPhotoUpload}
            disabled={uploadingPhoto}
            className="hidden"
            id="photo-gallery-upload"
            ref={(input) => {
              // Store reference for triggering upload
              if (input) {
                (window as any).photoGalleryInput = input;
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};