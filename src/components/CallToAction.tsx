'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Heart, Sparkles, Smartphone, Bell, Home } from 'lucide-react'

const CallToAction = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Lighter Dark Theme Background */}
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
        <motion.div
          animate={{ 
            x: [-20, 20, -20],
            y: [-10, 10, -10]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 rounded-full blur-xl"
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
              🚀 Join the Movement
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Join Our Growing
              </span>
              <span className="block bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                Community
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Connect with your neighbors, discover local opportunities, and stay 
              informed about everything happening in Wetaskiwin
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -200px 0px" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12"
          >
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block p-3 sm:p-4 bg-white/10 rounded-full mb-3 sm:mb-4"
              >
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Never miss local events, news, or community announcements
              </p>
            </div>
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="inline-block p-3 sm:p-4 bg-white/10 rounded-full mb-3 sm:mb-4"
              >
                <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Support Local</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Discover and support local businesses in your community
              </p>
            </div>
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block p-3 sm:p-4 bg-white/10 rounded-full mb-3 sm:mb-4"
              >
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Find Opportunities</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Explore job openings, marketplace deals, and volunteer opportunities
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -200px 0px" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/events"
                className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                Browse Events
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/businesses"
                className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                Explore Businesses
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Add to Home Screen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -200px 0px" }}
            className="mt-12 sm:mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-block p-3 sm:p-4 bg-white/20 rounded-full mb-3 sm:mb-4"
              >
                <Smartphone className="h-8 w-8 sm:h-10 sm:w-10" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Get Instant Updates</h3>
              <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                Add All Things Wetaskiwin to your home screen and receive push notifications for breaking news, 
                upcoming events, and community announcements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors text-sm sm:text-base shadow-lg"
                  onClick={() => {
                    // PWA install logic will go here
                    alert('Feature coming soon! For now, use your browser\'s "Add to Home Screen" option.')
                  }}
                >
                  <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add to Home Screen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center justify-center gap-2 border-2 border-white text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => {
                    // Notification permission logic will go here
                    if ('Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          alert('Notifications enabled! You\'ll receive updates about community events and news.')
                        }
                      })
                    }
                  }}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  Enable Notifications
                </motion.button>
              </div>
              <p className="text-xs text-blue-200 mt-3 sm:mt-4">
                Stay connected with your community • No spam, just important updates
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
