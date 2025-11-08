import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Firestore Permissions Error Banner
 * Shows when Firestore rules are blocking access
 */
const PermissionsErrorBanner = () => {
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Listen for Firestore permission errors
    const checkForErrors = () => {
      const errors = window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('firestore.googleapis.com'))
        .filter(entry => entry.responseStatus === 400 || entry.responseStatus === 403);
      
      if (errors.length > 0) {
        setHasPermissionError(true);
      }
    };

    // Check immediately and every 2 seconds
    checkForErrors();
    const interval = setInterval(checkForErrors, 2000);

    // Also listen for console errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('permission') || message.includes('insufficient')) {
        setHasPermissionError(true);
      }
      originalError.apply(console, args);
    };

    return () => {
      clearInterval(interval);
      console.error = originalError;
    };
  }, []);

  if (!hasPermissionError || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1">
                🔒 Firestore Permissions Error
              </h3>
              <p className="text-sm text-red-100 mb-2">
                Your Firestore security rules are blocking database access. This is normal for a new Firebase project.
              </p>
              
              {/* Instructions */}
              <div className="bg-red-700 rounded-lg p-3 mb-2 text-sm">
                <p className="font-semibold mb-2">Quick Fix (30 seconds):</p>
                <ol className="list-decimal list-inside space-y-1 text-red-100">
                  <li>Open Firestore Rules in Firebase Console</li>
                  <li>Replace rules with: <code className="bg-red-800 px-2 py-0.5 rounded">allow read, write: if request.auth != null;</code></li>
                  <li>Click "Publish"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              {/* Action Button */}
              <a
                href="https://console.firebase.google.com/project/dwts-11567/firestore/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                <span>Open Firestore Rules</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="flex-shrink-0 p-2 hover:bg-red-700 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PermissionsErrorBanner;
