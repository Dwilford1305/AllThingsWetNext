'use client';

import { Button } from '@/components/ui/Button';
import { X, Mail, Construction } from 'lucide-react';
import type { Business } from '@/types';

interface ComingSoonModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
}

const ComingSoonModal = ({ business, isOpen, onClose }: ComingSoonModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Feature Temporarily Disabled</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{business.name}</h3>
          <p className="text-sm text-gray-600">{business.address}</p>
        </div>

        <div className="text-center py-6">
          <Construction className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Business Claiming Temporarily Disabled
          </h3>
          <p className="text-gray-600 mb-6">
            We&apos;ve temporarily disabled the business claiming feature while we make improvements to the system. 
            We expect this feature to be available again soon.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Want to claim your business?</span>
            </div>
            <p className="text-sm text-blue-700">
              Contact{' '}
              <a 
                href={`mailto:wilfordderek@gmail.com?subject=Business Claim Request - All Things Wetaskiwin&body=Hello,%0D%0A%0D%0AI would like to claim my business listing:%0D%0A%0D%0ABusiness Name: ${encodeURIComponent(business.name)}%0D%0AAddress: ${encodeURIComponent(business.address)}%0D%0A%0D%0APlease let me know when the claiming feature will be available again.%0D%0A%0D%0AThank you!`}
                className="font-medium underline hover:no-underline"
              >
                wilfordderek@gmail.com
              </a>
              {' '}for more information and to be notified when business claiming is available again.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            asChild 
            variant="primary" 
            className="flex-1"
          >
            <a href={`mailto:wilfordderek@gmail.com?subject=Business Claim Request - All Things Wetaskiwin&body=Hello,%0D%0A%0D%0AI would like to claim my business listing:%0D%0A%0D%0ABusiness Name: ${encodeURIComponent(business.name)}%0D%0AAddress: ${encodeURIComponent(business.address)}%0D%0A%0D%0APlease let me know when the claiming feature will be available again.%0D%0A%0D%0AThank you!`}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
