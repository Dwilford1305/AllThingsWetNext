'use client';

import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ArrowRight, Users, Plus, Star, UserPlus, Calendar, ShoppingBag, Building } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface PageCallToActionProps {
  type: 'events' | 'news' | 'marketplace';
  className?: string;
}

const PageCallToAction = ({ type, className = '' }: PageCallToActionProps) => {
  const { isAuthenticated } = useAuth();

  const getContent = () => {
    switch (type) {
      case 'events':
        return {
          title: 'Start Selling in Your Community',
          subtitle: 'Turn your items into cash with free local listings',
          description: 'Join thousands of Wetaskiwin residents buying and selling locally. Post your first ad completely free.',
          features: [
            'Free community membership',
            'One free marketplace listing per month',
            'Connect with local buyers',
            'Safe community-based trading'
          ],
          primaryAction: {
            text: isAuthenticated ? 'Create Listing' : 'Join & List Item',
            href: isAuthenticated ? '/marketplace' : '/api/auth/login'
          },
          secondaryAction: {
            text: 'Browse Listings',
            href: '/marketplace'
          },
          icon: <ShoppingBag className="h-8 w-8" />,
          gradient: 'from-green-600 to-blue-700'
        };
      
      case 'news':
        return {
          title: 'Claim Your Business Listing',
          subtitle: 'Take control of your business presence in Wetaskiwin',
          description: 'Manage your business listing, subscription, and advertising space. Connect with customers and grow your local presence.',
          features: [
            'Manage your business listing for free',
            'Access to premium advertising options',
            'Update hours, contact info, and services',
            'Connect with thousands of local customers'
          ],
          primaryAction: {
            text: isAuthenticated ? 'Manage Business' : 'Join & Claim Business',
            href: isAuthenticated ? '/businesses/manage' : '/api/auth/login'
          },
          secondaryAction: {
            text: 'Browse Directory',
            href: '/businesses'
          },
          icon: <Building className="h-8 w-8" />,
          gradient: 'from-purple-600 to-pink-700'
        };
      
      case 'marketplace':
        return {
          title: 'Start Selling in Your Community',
          subtitle: 'Turn your items into cash with free local listings',
          description: 'Join thousands of Wetaskiwin residents buying and selling locally. Post your first ad completely free.',
          features: [
            'Free community membership',
            'One free marketplace listing per month',
            'Connect with local buyers',
            'Safe community-based trading'
          ],
          primaryAction: {
            text: isAuthenticated ? 'Create Listing' : 'Join & List Item',
            href: isAuthenticated ? '#create-listing' : '/api/auth/login'
          },
          secondaryAction: {
            text: 'Browse Listings',
            href: '/marketplace'
          },
          icon: <ShoppingBag className="h-8 w-8" />,
          gradient: 'from-orange-600 to-red-700'
        };
    }
  };

  const content = getContent();

  const handlePrimaryAction = (e: React.MouseEvent) => {
    if (content.primaryAction.href === '#create-listing' && isAuthenticated) {
      e.preventDefault();
      // Trigger the create listing modal by clicking the create button
      const createButton = document.querySelector('[data-create-listing]') as HTMLButtonElement;
      if (createButton) {
        createButton.click();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${className}`}
    >
      <Card className={`bg-gradient-to-br ${content.gradient} text-white border-0 overflow-hidden relative`}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              {/* Content */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    {content.icon}
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold leading-tight">
                      {content.title}
                    </h2>
                    <p className="text-white/80 text-sm lg:text-base">
                      {content.subtitle}
                    </p>
                  </div>
                </div>
                
                <p className="text-white/90 mb-6 leading-relaxed">
                  {content.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    asChild={content.primaryAction.href !== '#create-listing'}
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                    onClick={content.primaryAction.href === '#create-listing' ? handlePrimaryAction : undefined}
                  >
                    {content.primaryAction.href === '#create-listing' ? (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        {content.primaryAction.text}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <Link href={content.primaryAction.href}>
                        <UserPlus className="mr-2 h-5 w-5" />
                        {content.primaryAction.text}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    )}
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/50 text-white hover:bg-white hover:text-gray-900 backdrop-blur-sm font-semibold transition-all duration-200"
                  >
                    <Link href={content.secondaryAction.href}>
                      {content.secondaryAction.text}
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3">
                {content.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="bg-green-400 rounded-full p-1 flex-shrink-0">
                      <ArrowRight className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-white/90 text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default PageCallToAction;