'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Heart, Sparkles } from 'lucide-react'

const CallToAction = () => {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-12 sm:py-16 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-6 sm:top-10 left-6 sm:left-10 w-12 h-12 sm:w-20 sm:h-20 border-2 border-white rounded-full"></div>
        <div className="absolute top-20 sm:top-32 right-12 sm:right-20 w-10 h-10 sm:w-16 sm:h-16 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-12 sm:bottom-20 left-20 sm:left-32 w-8 h-8 sm:w-12 sm:h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 w-16 h-16 sm:w-24 sm:h-24 border-2 border-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -200px 0px" }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
              Join Our Growing Community
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
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
                Explore job openings, classifieds, and volunteer opportunities
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
                className="group inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg w-full sm:w-auto"
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
                className="group inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                Explore Businesses
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -200px 0px" }}
            className="mt-12 sm:mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Stay in the Loop</h3>
            <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">
              Get weekly updates about community events, local news, and opportunities delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                Subscribe
              </motion.button>
            </div>
            <p className="text-xs text-blue-200 mt-2 sm:mt-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
