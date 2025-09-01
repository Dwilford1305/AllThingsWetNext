'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Crown, Star, Zap, Check, BarChart3, HeadphonesIcon, TrendingUp } from 'lucide-react'

interface SubscriptionTier {
  id: 'free' | 'silver' | 'gold' | 'platinum';
  name: string;
  price: { monthly: number; annual: number };
  adQuota: number;
  features: string[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    adQuota: 1,
    features: ['1 ad per month', '1 photo per ad', '30-day duration', 'Basic support'],
    icon: Star,
    color: 'from-gray-400 to-gray-600'
  },
  {
    id: 'silver',
    name: 'Silver',
    price: { monthly: 9.99, annual: 99.99 },
    adQuota: 5,
    features: ['5 ads per month', '5 photos per ad', '45-day duration', 'Basic analytics'],
    icon: TrendingUp,
    color: 'from-gray-300 to-gray-500'
  },
  {
    id: 'gold',
    name: 'Gold',
    price: { monthly: 19.99, annual: 199.99 },
    adQuota: 15,
    features: ['15 ads per month', '10 photos per ad', '60-day duration', 'Featured ads', 'Analytics dashboard'],
    icon: Crown,
    color: 'from-yellow-400 to-yellow-600',
    popular: true
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: { monthly: 39.99, annual: 399.99 },
    adQuota: -1, // Unlimited
    features: ['Unlimited ads', '20 photos per ad', '90-day duration', 'Featured ads', 'Advanced analytics', 'Priority support'],
    icon: Zap,
    color: 'from-purple-400 to-purple-600'
  }
];

const SubscriptionShowcase = () => {
  const formatQuotaText = (quota: number) => {
    if (quota === -1 || quota === 9999) return 'Unlimited';
    return quota.toString();
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-purple-700 to-blue-800" />
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-800/20 via-transparent to-blue-800/15" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-white rounded-full"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-white rounded-full"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 font-semibold text-sm mb-8"
            >
              💎 Marketplace Subscriptions
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Sell More
              </span>
              <span className="block bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                Earn More
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Choose the perfect subscription plan to maximize your marketplace potential. 
              From free listings to unlimited premium features.
            </p>
          </motion.div>

          {/* Subscription Tiers Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {SUBSCRIPTION_TIERS.map((tier, index) => {
              const IconComponent = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`relative p-6 bg-white/10 backdrop-blur-sm rounded-2xl ${
                    tier.popular ? 'ring-2 ring-white/30 shadow-2xl' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">
                        {tier.id === 'free' ? 'Free' : `$${tier.price.monthly}`}
                      </span>
                      {tier.id !== 'free' && (
                        <span className="text-white/70 text-sm block">/month</span>
                      )}
                    </div>
                    <div className="bg-white/20 rounded-lg py-2 px-3 mb-4">
                      <span className="text-lg font-semibold text-white">
                        {formatQuotaText(tier.adQuota)} ads/month
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm text-white/90">
                        <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, amount: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/auth-test"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 w-full sm:w-auto shadow-lg"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/marketplace"
                className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                View Marketplace
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Bottom Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, amount: 0.1 }}
            className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-block p-4 bg-white/20 rounded-full mb-4"
                >
                  <Users className="h-8 w-8" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Local Community</h3>
                <p className="text-blue-100 text-sm">
                  Connect with buyers and sellers in Wetaskiwin
                </p>
              </div>
              <div className="text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="inline-block p-4 bg-white/20 rounded-full mb-4"
                >
                  <BarChart3 className="h-8 w-8" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Analytics Included</h3>
                <p className="text-blue-100 text-sm">
                  Track your ad performance with detailed insights
                </p>
              </div>
              <div className="text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-block p-4 bg-white/20 rounded-full mb-4"
                >
                  <HeadphonesIcon className="h-8 w-8" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
                <p className="text-blue-100 text-sm">
                  Get help when you need it with premium plans
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default SubscriptionShowcase