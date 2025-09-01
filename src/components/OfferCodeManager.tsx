'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users,
  Percent,
  DollarSign,
  Gift,
  Clock,
  Save,
  X
} from 'lucide-react';
import type { OfferCode, OfferType, SubscriptionTier } from '@/types';
import { authenticatedFetch } from '@/lib/auth-fetch';

interface OfferCodeManagerProps {
  className?: string;
}

interface NewOfferCode {
  code: string;
  name: string;
  description: string;
  offerType: 'discount_percentage' | 'discount_fixed' | 'free_upgrade' | 'free_months';
  discountPercentage?: number;
  discountAmount?: number;
  freeMonths?: number;
  upgradeToTier?: SubscriptionTier;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
  applicableTiers: ('free' | 'silver' | 'gold' | 'platinum')[];
  isActive: boolean;
}

const OfferCodeManager: React.FC<OfferCodeManagerProps> = () => {
  const [offerCodes, setOfferCodes] = useState<OfferCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<OfferCode | null>(null);
  const [formData, setFormData] = useState<NewOfferCode>({
    code: '',
    name: '',
    description: '',
    offerType: 'discount_percentage',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    applicableTiers: ['free'],
    isActive: true
  });

  useEffect(() => {
    fetchOfferCodes();
  }, []);

  const fetchOfferCodes = async () => {
    try {
      const response = await fetch('/api/admin/offer-codes');
      const result = await response.json();
      
      if (result.success) {
        setOfferCodes(result.data);
      } else {
        console.error('Failed to fetch offer codes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching offer codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        ...(editingCode && { id: editingCode.id }),
        createdBy: 'admin' // TODO: Get actual admin user ID from auth context
      };

      const response = await authenticatedFetch('/api/admin/offer-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Offer code ${editingCode ? 'updated' : 'created'} successfully!`);
        resetForm();
        fetchOfferCodes();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving offer code:', error);
      alert('Failed to save offer code');
    }
  };

  const handleEdit = (code: OfferCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description,
      offerType: code.offerType,
      discountPercentage: code.discountPercentage,
      discountAmount: code.discountAmount,
      freeMonths: code.freeMonths,
      upgradeToTier: code.upgradeToTier,
      maxUses: code.maxUses || undefined,
      validFrom: new Date(code.validFrom).toISOString().split('T')[0],
      validUntil: new Date(code.validUntil).toISOString().split('T')[0],
      applicableTiers: code.applicableTiers,
      isActive: code.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer code?')) return;
    
    try {
      const response = await authenticatedFetch(`/api/admin/offer-codes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Offer code deleted successfully!');
        fetchOfferCodes();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting offer code:', error);
      alert('Failed to delete offer code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      offerType: 'discount_percentage',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicableTiers: ['free'],
      isActive: true
    });
    setEditingCode(null);
    setShowForm(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-CA');
  };

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case 'discount_percentage': return <Percent className="h-4 w-4" />;
      case 'discount_fixed': return <DollarSign className="h-4 w-4" />;
      case 'free_upgrade': return <Gift className="h-4 w-4" />;
      case 'free_months': return <Clock className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getOfferTypeName = (type: string) => {
    switch (type) {
      case 'discount_percentage': return 'Percentage Discount';
      case 'discount_fixed': return 'Fixed Discount';
      case 'free_upgrade': return 'Free Upgrade';
      case 'free_months': return 'Free Months';
      default: return type;
    }
  };

  const getOfferValue = (code: OfferCode) => {
    switch (code.offerType) {
      case 'discount_percentage': return `${code.discountPercentage}% off`;
      case 'discount_fixed': return `$${code.discountAmount} off`;
      case 'free_upgrade': return `Free ${code.upgradeToTier} upgrade`;
      case 'free_months': return `${code.freeMonths} free months`;
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Offer Code Management</h3>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center"
          >
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? 'Cancel' : 'Create Offer Code'}
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="p-4 mb-6 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4">
              {editingCode ? 'Edit Offer Code' : 'Create New Offer Code'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., WELCOME20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Welcome Discount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Description shown to users"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.offerType}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value as OfferType })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Offer Type"
                  >
                    <option value="discount_percentage">Percentage Discount</option>
                    <option value="discount_fixed">Fixed Amount Discount</option>
                    <option value="free_upgrade">Free Tier Upgrade</option>
                    <option value="free_months">Free Months</option>
                  </select>
                </div>

                {/* Conditional offer value fields */}
                {formData.offerType === 'discount_percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discountPercentage || ''}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 20"
                      required
                    />
                  </div>
                )}

                {formData.offerType === 'discount_fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.discountAmount || ''}
                      onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10.00"
                      required
                    />
                  </div>
                )}

                {formData.offerType === 'free_upgrade' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upgrade To Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.upgradeToTier || ''}
                      onChange={(e) => setFormData({ ...formData, upgradeToTier: e.target.value as SubscriptionTier })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      aria-label="Upgrade To Tier"
                    >
                      <option value="">Select tier...</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>
                )}

                {formData.offerType === 'free_months' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Free Months <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.freeMonths || ''}
                      onChange={(e) => setFormData({ ...formData, freeMonths: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Valid From Date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Valid Until Date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Tiers <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['free', 'silver', 'gold', 'platinum'].map((tier) => (
                    <label key={tier} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.applicableTiers.includes(tier as SubscriptionTier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicableTiers: [...formData.applicableTiers, tier as SubscriptionTier]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicableTiers: formData.applicableTiers.filter(t => t !== tier)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                  aria-label="Offer Code Active Status"
                />
                <span className="text-sm text-gray-700">Active</span>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {editingCode ? 'Update' : 'Create'} Offer Code
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Offer Codes List */}
        <div className="space-y-4">
          {offerCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No offer codes created yet.</p>
              <p className="text-sm">Create your first offer code to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {offerCodes.map((code) => (
                <Card key={code.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center">
                          {getOfferTypeIcon(code.offerType)}
                          <span className="font-mono text-lg font-bold text-blue-600 ml-2">
                            {code.code}
                          </span>
                        </div>
                        <Badge className={code.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getOfferTypeName(code.offerType)}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">{code.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-medium text-green-600">{getOfferValue(code)}</span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(code.validFrom)} - {formatDate(code.validUntil)}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''} uses
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-xs text-gray-400">
                          Applicable to: {code.applicableTiers.join(', ')} tiers
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OfferCodeManager;
