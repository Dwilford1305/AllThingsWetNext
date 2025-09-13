'use client';

import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import SubscriptionUpgradeModal from './SubscriptionUpgradeModal';
import { authenticatedFetch } from '@/lib/auth-fetch';
import { 
  Building, 
  Star, 
  Award, 
  Shield, 
  Eye, 
  MousePointer, 
  Phone as PhoneIcon, 
  Globe,
  TrendingUp,
  CreditCard,
  Edit,
  X,
  Ticket,
  Check
} from 'lucide-react';
import type { Business, OfferCodeValidationResult, BusinessAd } from '@/types';
import AdPreview from './AdPreview';
import { PhotoGalleryModal } from './PhotoGalleryModal';

interface BusinessDashboardProps {
  business: Business;
  onUpdate?: (updatedBusiness: Business) => void;
}

export const BusinessDashboard = ({ business, onUpdate }: BusinessDashboardProps) => {
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showNewUpgradeModal, setShowNewUpgradeModal] = useState(false);
  const [preSelectedTier, setPreSelectedTier] = useState<string | undefined>(undefined);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [offerCode, setOfferCode] = useState('');
  const [offerCodeValidation, setOfferCodeValidation] = useState<OfferCodeValidationResult | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: business.name || '',
    description: business.description || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    address: business.address || ''
  });
  
  // Photo and logo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [adPreview, setAdPreview] = useState<Record<string, unknown> | null>(null);
  const [showAdPreview, setShowAdPreview] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingUploadType, setPendingUploadType] = useState<'photo' | 'logo' | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  // File validation constants
  const PHOTO_SIZE_LIMITS = {
    silver: 2 * 1024 * 1024, // 2MB
    gold: 5 * 1024 * 1024,   // 5MB
    platinum: 10 * 1024 * 1024 // 10MB
  };
  const LOGO_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

  // Client-side file validation
  const validateFile = (file: File, type: 'photo' | 'logo', tier: string) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'File must be an image (JPG, PNG, GIF, WebP)'
      };
    }

    // Check file size based on type and tier
    if (type === 'photo') {
      const maxSize = PHOTO_SIZE_LIMITS[tier as keyof typeof PHOTO_SIZE_LIMITS];
      if (!maxSize) {
        return {
          valid: false,
          error: 'Photo upload requires silver tier or higher'
        };
      }
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `Photo size (${Math.round(file.size / (1024 * 1024))}MB) exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit for ${tier} tier`
        };
      }
    } else if (type === 'logo') {
      if (tier !== 'platinum') {
        return {
          valid: false,
          error: 'Logo upload requires platinum tier'
        };
      }
      if (file.size > LOGO_SIZE_LIMIT) {
        return {
          valid: false,
          error: `Logo size (${Math.round(file.size / (1024 * 1024))}MB) exceeds ${Math.round(LOGO_SIZE_LIMIT / (1024 * 1024))}MB limit`
        };
      }
    }

    return { valid: true };
  };

  // Permission request for file access
  const requestFilePermission = (type: 'photo' | 'logo'): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingUploadType(type);
      setShowPermissionDialog(true);
      
      // Store resolve function for later use
      (window as unknown as { permissionResolve?: (value: boolean) => void }).permissionResolve = resolve;
    });
  };

  const handlePermissionResponse = (granted: boolean) => {
    setShowPermissionDialog(false);
    const resolve = (window as unknown as { permissionResolve?: (value: boolean) => void }).permissionResolve;
    if (resolve) {
      resolve(granted);
      delete (window as unknown as { permissionResolve?: (value: boolean) => void }).permissionResolve;
    }
    setPendingUploadType(null);
  };

  // Business subscription tiers for the new modal
  const businessTiers = [
    {
      id: 'silver',
      name: 'Silver',
      price: { monthly: 19.99, annual: 199.99 },
      description: 'Perfect for small businesses getting started online',
      features: [
        'Enhanced business listing',
        'Contact form integration', 
        'Basic analytics dashboard',
        'Business hours display',
        '2 job postings per month',
        'Email support'
      ],
      color: 'text-gray-600'
    },
    {
      id: 'gold',
      name: 'Gold',
      price: { monthly: 39.99, annual: 399.99 },
      description: 'Ideal for growing businesses seeking more visibility',
      features: [
        'Everything in Silver',
        'Photo gallery (up to 10 photos)',
        'Social media links integration',
        'Special offers and promotions',
        'Featured placement in directory',
        '5 job postings per month',
        'Priority email support'
      ],
      popular: true,
      color: 'text-yellow-600'
    },
    {
      id: 'platinum',
      name: 'Platinum',
      price: { monthly: 79.99, annual: 799.99 },
      description: 'Complete business marketing solution',
      features: [
        'Everything in Gold',
        'Custom logo upload',
        'Advanced analytics & reporting',
        'Priority support with dedicated manager',
        'Custom business description',
        'Unlimited job postings',
        'Phone support',
        'Monthly performance review'
      ],
      color: 'text-purple-600'
    }
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'silver': return <Shield className="h-4 w-4" />;
      case 'gold': return <Star className="h-4 w-4" />;
      case 'platinum': return <Award className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'silver': return 'bg-gray-400 text-white';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'platinum': return 'bg-purple-600 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };


  const handleNewUpgrade = (tier?: string) => {
    setPreSelectedTier(tier);
    setShowNewUpgradeModal(true);
  };

  const handleUpgradeSuccess = async (tier: string, paymentId: string) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/businesses/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionTier: tier,
          duration: 12, // Annual billing
          paymentId,
          businessId: business.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the business object with new subscription
        const updatedBusiness = { 
          ...business, 
          subscriptionTier: tier as 'free' | 'silver' | 'gold' | 'platinum',
          subscriptionStatus: 'active' as const
        };
        onUpdate?.(updatedBusiness);
        alert('🎉 Business subscription upgraded successfully! Your new features are now active.');
      } else {
        alert('Error upgrading subscription: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again later.');
    } finally {
      setLoading(false);
      setShowNewUpgradeModal(false);
    }
  };

  const validateOfferCode = async () => {
    if (!offerCode.trim()) {
      setOfferCodeValidation(null);
      return;
    }

    setValidatingCode(true);
    try {
      const tierPricing = {
        silver: { monthly: 19.99, annual: 199.99 },
        gold: { monthly: 39.99, annual: 399.99 },
        platinum: { monthly: 79.99, annual: 799.99 }
      };

      const basePrice = tierPricing[selectedTier as keyof typeof tierPricing]?.annual || 0;

      const response = await authenticatedFetch('/api/businesses/validate-offer-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: offerCode,
          currentTier: business.subscriptionTier || 'free',
          targetTier: selectedTier,
          basePrice
        })
      });

      const result = await response.json();
      if (result.success) {
        setOfferCodeValidation(result.data);
      } else {
        setOfferCodeValidation({
          isValid: false,
          error: 'Failed to validate offer code'
        });
      }
    } catch (error) {
      console.error('Offer code validation error:', error);
      setOfferCodeValidation({
        isValid: false,
        error: 'Failed to validate offer code'
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const confirmUpgrade = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/businesses/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          subscriptionTier: selectedTier,
          duration: 12,
          ...(offerCode.trim() && { offerCode: offerCode.trim() }),
          userId: 'current-user' // TODO: Get from auth context
        })
      });

      const result = await response.json();
      if (result.success && onUpdate) {
        onUpdate(result.data.business);
        const message = result.data.pricing.offerCode 
          ? `Successfully upgraded to ${selectedTier} tier! Offer code ${result.data.pricing.offerCode.code} applied with $${result.data.pricing.offerCode.discountApplied.toFixed(2)} discount.`
          : `Successfully upgraded to ${selectedTier} tier!`;
        alert(message);
        closeUpgradeModal();
      } else {
        alert(result.error || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setSelectedTier('');
    setOfferCode('');
    setOfferCodeValidation(null);
  };

  const handleEditBusiness = () => {
    setEditForm({
      name: business.name || '',
      description: business.description || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      address: business.address || ''
    });
    setShowEditModal(true);
  };

  const saveBusinessInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();
      if (result.success && onUpdate) {
        onUpdate({ ...business, ...editForm });
        alert('Business information updated successfully!');
        setShowEditModal(false);
      } else {
        alert(result.error || 'Failed to update business information');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update business information');
    } finally {
      setLoading(false);
    }
  };

  // Photo upload trigger with permission request
  const triggerPhotoUpload = async () => {
    // Request permission first
    const permissionGranted = await requestFilePermission('photo');
    if (!permissionGranted) {
      return; // User denied permission
    }

    // Try both methods to trigger file input click
    const fileInput1 = document.getElementById('photo-gallery-upload') as HTMLInputElement;
    const fileInput2 = (window as unknown as Record<string, unknown>).photoGalleryInput as HTMLInputElement | undefined;
    
    const fileInput = fileInput1 || fileInput2;
    if (fileInput) {
      fileInput.click();
    } else {
      console.warn('Photo upload input not found');
      alert('Unable to open file picker. Please try again.');
    }
  };

  // Open photo gallery modal
  const openPhotoGallery = () => {
    setShowPhotoGallery(true);
  };

  // Handle photos update from gallery modal
  const handlePhotosUpdate = (updatedPhotos: string[]) => {
    const updatedBusiness = {
      ...business,
      photos: updatedPhotos
    };
    onUpdate?.(updatedBusiness);
  };

  // Logo upload trigger with permission request
  const triggerLogoUpload = async () => {
    // Request permission first
    const permissionGranted = await requestFilePermission('logo');
    if (!permissionGranted) {
      return; // User denied permission
    }

    // Trigger file input click
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Convert file to base64 for direct storage (like marketplace)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    // Client-side validation
    const validation = validateFile(file, 'photo', currentTier);
    if (!validation.valid) {
      alert(validation.error);
      // Reset file input
      event.target.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      // Use marketplace-style base64 conversion for reliable photo display
      const base64Photo = await fileToBase64(file);
      
      // Send the base64 data to the server for storage
      const response = await authenticatedFetch('/api/businesses/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          photoData: base64Photo
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Photo uploaded successfully!');
        // Update business with new photo using the base64 data directly
        const updatedBusiness = {
          ...business,
          photos: [...(business.photos || []), base64Photo]
        };
        if (onUpdate) {
          onUpdate(updatedBusiness);
        }
      } else {
        // Provide more specific error messages
        let errorMessage = result.error || 'Failed to upload photo';
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = result.error || 'You do not have permission to upload photos for this business.';
        } else if (response.status === 404) {
          errorMessage = 'Business not found or you do not have permission to edit it.';
        } else if (response.status === 413) {
          errorMessage = result.error || 'File size is too large.';
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      let errorMessage = 'Failed to upload photo. ';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'Please check your internet connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      alert(errorMessage);
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    // Client-side validation
    const validation = validateFile(file, 'logo', currentTier);
    if (!validation.valid) {
      alert(validation.error);
      // Reset file input
      event.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('businessId', business.id);

      const response = await authenticatedFetch('/api/businesses/logo', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Logo uploaded successfully!');
        // Update business with new logo
        const updatedBusiness = {
          ...business,
          logo: result.data.logoUrl
        };
        if (onUpdate) {
          onUpdate(updatedBusiness);
        }
      } else {
        // Provide more specific error messages
        let errorMessage = result.error || 'Failed to upload logo';
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = result.error || 'Logo upload requires platinum tier.';
        } else if (response.status === 404) {
          errorMessage = 'Business not found or you do not have permission to edit it.';
        } else if (response.status === 413) {
          errorMessage = result.error || 'Logo file size is too large.';
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      let errorMessage = 'Failed to upload logo. ';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'Please check your internet connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      alert(errorMessage);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Ad preview handler
  const handleAdPreview = async () => {
    try {
      const response = await authenticatedFetch(`/api/businesses/ads?preview=true&businessId=${business.id}`);

      const result = await response.json();
      if (result.success) {
        setAdPreview(result.data);
        setShowAdPreview(true);
      } else {
        // Provide more specific error messages based on response status
        let errorMessage = result.error || 'Failed to generate ad preview';
        if (response.status === 401) {
          errorMessage = '🔐 Authentication required. Please log in to preview your ad.';
        } else if (response.status === 403) {
          errorMessage = '🔒 Ad preview requires a subscription. Please upgrade your plan.';
        } else if (response.status === 404) {
          errorMessage = '🏢 Business not found or you don\'t have permission to preview this ad.';
        } else if (response.status === 500) {
          errorMessage = '⚠️ Database connection error. This feature requires database access in production.';
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Ad preview error:', error);
      let errorMessage = '❌ Failed to generate ad preview. ';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += '🌐 Please check your internet connection or try again later.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += '🔄 Please try again.';
      }
      alert(errorMessage);
    }
  };

  // Save ad handler
  const handleSaveAd = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/businesses/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Ad saved successfully! It will now appear in rotation on the website.');
        setShowAdPreview(false);
      } else {
        alert(result.error || 'Failed to save ad');
      }
    } catch (error) {
      console.error('Save ad error:', error);
      alert('Failed to save ad');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = business.subscriptionTier || 'free';
  const analytics = business.analytics || { views: 0, clicks: 0, callClicks: 0, websiteClicks: 0 };

  return (
    <div className="space-y-6">
      {/* Business Info Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h2>
            <p className="text-gray-600">{business.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getTierColor(currentTier)}>
              {getTierIcon(currentTier)}
              <span className="ml-1">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>
            </Badge>
            {business.featured && (
              <Badge className="bg-yellow-500 text-black">Featured</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2" />
            <span>{business.category}</span>
          </div>
          {business.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span>{business.phone}</span>
            </div>
          )}
          {business.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                Website
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Analytics (Premium Feature) */}
      {currentTier !== 'free' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Analytics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.views}</div>
              <div className="text-sm text-gray-600">Views</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MousePointer className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.clicks}</div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <PhoneIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.callClicks}</div>
              <div className="text-sm text-gray-600">Phone Clicks</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.websiteClicks}</div>
              <div className="text-sm text-gray-600">Website Clicks</div>
            </div>
          </div>
        </Card>
      )}

      {/* Subscription Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Subscription Management
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</h4>
            {business.subscriptionEnd && (
              <p className="text-sm text-gray-600">
                Valid until: {new Date(business.subscriptionEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {currentTier === 'free' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Silver
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$19.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Enhanced listing</li>
                  <li>• Contact form</li>
                  <li>• Basic analytics</li>
                  <li>• Business hours</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleNewUpgrade('silver')}
                  disabled={loading}
                >
                  Upgrade with PayPal
                </Button>
              </div>

              <div className="p-4 border-2 border-yellow-500 rounded-lg relative">
                <Badge className="absolute -top-2 left-4 bg-yellow-500 text-black">Popular</Badge>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Gold
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$39.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Everything in Silver</li>
                  <li>• Photo gallery</li>
                  <li>• Social media links</li>
                  <li>• Featured placement</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleNewUpgrade('gold')}
                  disabled={loading}
                >
                  Upgrade to Gold
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Platinum
                </h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$79.99<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>• Everything in Gold</li>
                  <li>• Logo upload</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleNewUpgrade('platinum')}
                  disabled={loading}
                >
                  Upgrade to Platinum
                </Button>
              </div>
            </div>
          )}

          {currentTier !== 'free' && currentTier !== 'platinum' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Want more features? Upgrade your plan!</p>
              <div className="space-x-2">
                {currentTier === 'silver' && (
                  <>
                    <Button 
                      variant="primary" 
                      onClick={() => handleNewUpgrade('gold')}
                      disabled={loading}
                    >
                      Upgrade to Gold
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleNewUpgrade('platinum')}
                      disabled={loading}
                    >
                      Upgrade to Platinum
                    </Button>
                  </>
                )}
                {currentTier === 'gold' && (
                  <Button 
                    variant="primary" 
                    onClick={() => handleNewUpgrade('platinum')}
                    disabled={loading}
                  >
                    Upgrade to Platinum
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Business Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Edit className="h-5 w-5 mr-2" />
          Manage Listing
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Update your business information, add photos, and manage your listing details.
          </p>
          <div className="space-x-2">
            <Button variant="primary" size="sm" onClick={handleEditBusiness}>
              Edit Business Info
            </Button>
            {(currentTier === 'gold' || currentTier === 'platinum') && (
              <>
                <input
                  id="photo-gallery-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={uploadingPhoto}
                  onClick={openPhotoGallery}
                >
                  Manage Photos
                </Button>
              </>
            )}
            {currentTier === 'platinum' && (
              <>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={triggerLogoUpload}
                >
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </>
            )}
            {currentTier !== 'free' && (
              <Button variant="outline" size="sm" onClick={handleAdPreview}>
                Preview Ad
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Business Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Business Information
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      aria-label="Business Name"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      aria-label="Business Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe your business, services, and what makes you unique..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">Tips for a great listing:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use a clear, descriptive business name</li>
                        <li>• Include your main phone number for customer contact</li>
                        <li>• Add a detailed description of your products/services</li>
                        <li>• Keep your address accurate for local customers</li>
                        <li>• Include your website to drive online traffic</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveBusinessInfo}
                    disabled={loading || !editForm.name.trim()}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upgrade to {selectedTier?.charAt(0).toUpperCase() + selectedTier?.slice(1)} Tier
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeUpgradeModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Tier Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Annual Subscription</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${selectedTier === 'silver' ? '199.99' : 
                        selectedTier === 'gold' ? '399.99' : 
                        selectedTier === 'platinum' ? '799.99' : '0.00'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save 2 months compared to monthly billing
                  </p>
                </div>

                {/* Offer Code Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Ticket className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Have an offer code?</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                        onBlur={validateOfferCode}
                        placeholder="Enter offer code"
                        className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Offer Code"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateOfferCode}
                        disabled={validatingCode || !offerCode.trim()}
                      >
                        {validatingCode ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>

                    {/* Offer Code Validation Result */}
                    {offerCodeValidation && (
                      <div className={`p-3 rounded ${
                        offerCodeValidation.isValid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {offerCodeValidation.isValid ? (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800 mb-1">
                                Offer code applied successfully!
                              </p>
                              <p className="text-sm text-green-700 mb-2">
                                {offerCodeValidation.description}
                              </p>
                              
                              {offerCodeValidation.discountPercentage && (
                                <p className="text-sm text-green-800">
                                  <strong>{offerCodeValidation.discountPercentage}% discount</strong> - 
                                  Save ${offerCodeValidation.discountAmount?.toFixed(2)}
                                </p>
                              )}
                              
                              {offerCodeValidation.discountAmount && !offerCodeValidation.discountPercentage && (
                                <p className="text-sm text-green-800">
                                  <strong>${offerCodeValidation.discountAmount.toFixed(2)} discount</strong>
                                </p>
                              )}
                              
                              {offerCodeValidation.freeMonths && (
                                <p className="text-sm text-green-800">
                                  <strong>{offerCodeValidation.freeMonths} free months</strong> added to your subscription
                                </p>
                              )}
                              
                              {offerCodeValidation.upgradeToTier && (
                                <p className="text-sm text-green-800">
                                  <strong>Free upgrade</strong> to {offerCodeValidation.upgradeToTier} tier
                                </p>
                              )}
                              
                              {offerCodeValidation.finalPrice !== undefined && (
                                <p className="text-lg font-bold text-green-800 mt-2">
                                  Final Price: ${offerCodeValidation.finalPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start">
                            <X className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">
                              {offerCodeValidation.error}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">What&apos;s included:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedTier === 'silver' && (
                      <>
                        <li>• Enhanced listing with contact forms</li>
                        <li>• Basic analytics and insights</li>
                        <li>• Business hours display</li>
                        <li>• Priority customer support</li>
                      </>
                    )}
                    {selectedTier === 'gold' && (
                      <>
                        <li>• Everything in Silver</li>
                        <li>• Photo gallery with up to 10 images</li>
                        <li>• Social media integration</li>
                        <li>• Featured placement in search results</li>
                        <li>• Special offers and promotions</li>
                      </>
                    )}
                    {selectedTier === 'platinum' && (
                      <>
                        <li>• Everything in Gold</li>
                        <li>• Custom logo upload</li>
                        <li>• Advanced analytics and reporting</li>
                        <li>• Priority support with dedicated account manager</li>
                        <li>• Custom business description</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={closeUpgradeModal}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmUpgrade}
                    disabled={loading}
                    className="flex items-center"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Confirm Upgrade'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New PayPal Upgrade Modal */}
      <SubscriptionUpgradeModal
        isOpen={showNewUpgradeModal}
        onClose={() => {
          setShowNewUpgradeModal(false);
          setPreSelectedTier(undefined);
        }}
        tiers={businessTiers}
        currentTier={currentTier}
        onUpgradeSuccess={handleUpgradeSuccess}
        type="business"
        preSelectedTier={preSelectedTier}
      />

      {/* Ad Preview Modal */}
      {showAdPreview && adPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ad Preview - {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Tier
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  This is how your ad will appear throughout the website based on your current subscription tier.
                </p>
                
                <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
                  <AdPreview ad={adPreview as unknown as BusinessAd} />
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Tier:</strong> {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</p>
                  <p><strong>Photo:</strong> {(adPreview as unknown as BusinessAd).photo ? 'Uploaded' : 'Not uploaded'}</p>
                  {currentTier === 'platinum' && (
                    <p><strong>Logo:</strong> {(adPreview as unknown as BusinessAd).logo ? 'Uploaded' : 'Not uploaded'}</p>
                  )}
                  <p><strong>Ad Size:</strong> {(adPreview as unknown as BusinessAd).adSize.width} × {(adPreview as unknown as BusinessAd).adSize.height} pixels</p>
                </div>

                {!(adPreview as unknown as BusinessAd).photo && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> Upload a photo to activate your ad and display it throughout the website.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdPreview(false)}
                    disabled={loading}
                  >
                    Close
                  </Button>
                  {(adPreview as unknown as BusinessAd).photo && (
                    <Button
                      variant="primary"
                      onClick={handleSaveAd}
                      disabled={loading}
                      className="flex items-center"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save & Activate Ad'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        businessId={business.id}
        photos={business.photos || []}
        onPhotosUpdate={handlePhotosUpdate}
        tier={currentTier}
        uploadingPhoto={uploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        onTriggerUpload={triggerPhotoUpload}
      />

      {/* File Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {pendingUploadType === 'photo' ? (
                  <Building className="h-6 w-6 text-white" />
                ) : (
                  <Award className="h-6 w-6 text-white" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                File Access Permission
              </h3>
              <p className="text-gray-600 mb-6">
                This app would like to access your device&apos;s photo gallery to upload{' '}
                {pendingUploadType === 'photo' ? 'business photos' : 'your business logo'}.
                Would you like to allow access?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handlePermissionResponse(false)}
                  className="flex-1"
                >
                  Deny
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handlePermissionResponse(true)}
                  className="flex-1"
                >
                  Allow
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
