'use client';

import type { Metadata } from "next";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-16 h-16 mb-6 text-gray-400">
          <svg 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L5.636 5.636m12.728 12.728L18.364 18.364M12 21a9 9 0 110-18 9 9 0 010 18z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Please check your network settings and try again.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Cached Content Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Some previously visited pages may still be available while offline.
          </p>
        </div>

        {/* Connection Tips */}
        <div className="mt-6 text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Connection Tips:
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check if Wi-Fi is turned on</li>
            <li>• Verify your internet connection</li>
            <li>• Try switching between Wi-Fi and mobile data</li>
            <li>• Restart your router if using Wi-Fi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}