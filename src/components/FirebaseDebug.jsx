import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Firebase Debug Component
 * Shows Firebase connection status and configuration
 * Remove this component in production
 */
const FirebaseDebug = () => {
  const [config, setConfig] = useState({});
  const [authStatus, setAuthStatus] = useState('checking');
  const [firestoreStatus, setFirestoreStatus] = useState('checking');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    // Get config (safely, without exposing API keys in production)
    const firebaseConfig = {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'NOT SET',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'NOT SET',
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ SET' : '❌ NOT SET',
    };
    setConfig(firebaseConfig);

    // Check Auth
    try {
      if (auth) {
        setAuthStatus('connected');
      } else {
        setAuthStatus('error');
      }
    } catch (error) {
      setAuthStatus('error');
      console.error('Auth error:', error);
    }

    // Check Firestore
    try {
      if (db) {
        setFirestoreStatus('connected');
      } else {
        setFirestoreStatus('error');
      }
    } catch (error) {
      setFirestoreStatus('error');
      console.error('Firestore error:', error);
    }
  }, []);

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 transition-all">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-xs">Firebase Debug</h3>
        </div>
        <span className="text-xs text-gray-500">{isCollapsed ? '▼' : '▲'}</span>
      </button>

      {!isCollapsed && (
        <div className="p-4 pt-0 w-80">
          <div className="space-y-2 text-sm">
        {/* Auth Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-400">Auth:</span>
          <div className="flex items-center gap-2">
            <StatusIcon status={authStatus} />
            <span className="font-medium">{authStatus}</span>
          </div>
        </div>

        {/* Firestore Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-400">Firestore:</span>
          <div className="flex items-center gap-2">
            <StatusIcon status={firestoreStatus} />
            <span className="font-medium">{firestoreStatus}</span>
          </div>
        </div>

        {/* Project ID */}
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Project:</span>
          <span className="font-mono text-xs break-all">{config.projectId}</span>
        </div>

        {/* Auth Domain */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-400">Domain:</span>
          <span className="font-mono text-xs break-all">{config.authDomain}</span>
        </div>

        {/* API Key Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-400">API Key:</span>
          <span className="font-medium">{config.apiKey}</span>
        </div>

        {/* Troubleshooting */}
        {(authStatus === 'error' || firestoreStatus === 'error' || config.projectId === 'NOT SET') && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2">
              ⚠️ Firebase Configuration Issue
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Check your .env file exists</li>
              <li>Verify Firebase credentials</li>
              <li>Restart dev server (npm run dev)</li>
              <li>Check Firebase Console settings</li>
            </ul>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseDebug;
