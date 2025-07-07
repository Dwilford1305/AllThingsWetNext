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
    <section className="relative py-12 sm:py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-hidden">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Your Community at a Glance
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
            Join thousands of Wetaskiwin residents who stay connected through our community hub
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full overflow-hidden">
            {[
              { value: stats.events, label: 'Active Events', icon: Calendar, color: 'text-blue-600' },
              { value: stats.businesses, label: 'Local Businesses', icon: Building, color: 'text-green-600' },
              { value: stats.jobs, label: 'Job Listings', icon: Briefcase, color: 'text-purple-600' },
              { value: stats.members, label: 'Community Members', icon: Users, color: 'text-orange-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 border-transparent hover:border-blue-200 transition-all duration-300 w-full min-w-0"
              >
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} mx-auto mb-2 sm:mb-3`} />
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-600 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px -100px 0px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full overflow-hidden"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.2, margin: "0px 0px -100px 0px" }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300 w-full min-w-0"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`p-2 sm:p-3 rounded-lg bg-gray-50 ${feature.color} flex-shrink-0`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
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
            <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-blue-200" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Proudly Serving Wetaskiwin</h3>
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
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
