'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Calendar, Building, Briefcase, Users, MapPin } from 'lucide-react'

const CommunityStats = () => {
  const [stats, setStats] = useState({
    events: 0,
    businesses: 0,
    jobs: 0,
    members: 1250 // Simulated community members
  })

  const getFeatureGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600'
    ]
    return gradients[index % gradients.length]
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/seed')
        const data = await response.json()
        if (data.success && data.data) {
          setStats(prev => ({
            ...prev,
            events: data.data.events || 0,
            businesses: data.data.businesses || 0,
            jobs: data.data.jobs || 0
          }))
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      icon: Calendar,
      title: 'Community Events',
      description: 'From farmers markets to festivals, discover exciting happenings in Wetaskiwin',
      color: 'text-blue-600'
    },
    {
      icon: Building,
      title: 'Local Businesses',
      description: 'Support your local economy and discover amazing businesses in your area',
      color: 'text-green-600'
    },
    {
      icon: Briefcase,
      title: 'Job Opportunities',
      description: 'Find your next career opportunity with local employers in Wetaskiwin',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Community Network',
      description: 'Connect with neighbors and build lasting relationships in your community',
      color: 'text-orange-600'
    }
  ]

  return (
    <section className="relative py-20 md:py-32">
      {/* Modern Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-float" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Enhanced Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-2 bg-gradient-to-r from-white/10 to-blue-200/10 backdrop-blur-sm rounded-full text-blue-200 font-semibold text-sm mb-6"
          >
            📊 Community Insights
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Your Community at a Glance
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto mb-12">
            Join thousands of Wetaskiwin residents who stay connected through our community hub
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
            {[
              { value: stats.events, label: 'Active Events', icon: Calendar, gradient: 'from-blue-500 to-blue-600' },
              { value: stats.businesses, label: 'Local Businesses', icon: Building, gradient: 'from-green-500 to-green-600' },
              { value: stats.jobs, label: 'Job Listings', icon: Briefcase, gradient: 'from-purple-500 to-purple-600' },
              { value: stats.members, label: 'Community Members', icon: Users, gradient: 'from-orange-500 to-orange-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <div className="glass-card rounded-2xl p-6 lg:p-8 border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`} />
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-blue-100 leading-tight">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        {/* Enhanced Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-20 w-full"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * index, ease: [0.4, 0, 0.2, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group glass-card rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 border-white/10 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getFeatureGradient(index)} opacity-10 rounded-full -translate-y-16 translate-x-16`} />
              
              <div className="flex items-start space-x-6 relative z-10">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${getFeatureGradient(index)} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Location Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
            <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-white/80" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Proudly Serving Wetaskiwin</h3>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Located in the heart of Alberta, Wetaskiwin is a vibrant community rich in history, 
              culture, and opportunity. We&apos;re here to help you discover all it has to offer.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CommunityStats
