/**
 * ConflictResolutionModal Component
 * Side-by-side diff viewer for offline sync conflicts
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveConflict } from '../lib/offlineQueue';

export default function ConflictResolutionModal({ conflict, onResolve, onClose }) {
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [resolving, setResolving] = useState(false);

  if (!conflict) return null;

  const handleResolve = async () => {
    if (!selectedResolution) return;

    setResolving(true);
    try {
      await resolveConflict(conflict.queueId, selectedResolution);
      onResolve?.();
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setResolving(false);
    }
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return <span className="text-neutral-400 italic">null</span>;
    if (typeof value === 'object') return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
    if (typeof value === 'boolean') return <span className={value ? 'text-green-600' : 'text-red-600'}>{String(value)}</span>;
    return <span>{String(value)}</span>;
  };

  const getChangedFields = () => {
    const fields = new Set();
    if (conflict.localData) Object.keys(conflict.localData).forEach(k => fields.add(k));
    if (conflict.serverData) Object.keys(conflict.serverData).forEach(k => fields.add(k));
    return Array.from(fields).sort();
  };

  const changedFields = getChangedFields();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">⚠️ Sync Conflict Detected</h2>
                <p className="text-white/90">
                  Changes were made offline and online. Choose which version to keep.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Conflict Info */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Conflict in {conflict.collection}/{conflict.documentId}
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Operation: <span className="font-medium">{conflict.operation}</span> · 
                    Detected: {new Date(conflict.detectedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Keep Local */}
              <button
                onClick={() => setSelectedResolution('keep-local')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedResolution === 'keep-local'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedResolution === 'keep-local'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}>
                    {selectedResolution === 'keep-local' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white">Keep Local</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-left">
                  Use your offline changes and discard server changes
                </p>
              </button>

              {/* Keep Server */}
              <button
                onClick={() => setSelectedResolution('keep-server')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedResolution === 'keep-server'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedResolution === 'keep-server'
                      ? 'border-green-500 bg-green-500'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}>
                    {selectedResolution === 'keep-server' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white">Keep Server</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-left">
                  Use server changes and discard your offline changes
                </p>
              </button>

              {/* Merge */}
              <button
                onClick={() => setSelectedResolution('merge')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedResolution === 'merge'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedResolution === 'merge'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}>
                    {selectedResolution === 'merge' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white">Merge Both</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-left">
                  Combine both changes (local takes priority)
                </p>
              </button>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 bg-neutral-100 dark:bg-neutral-800">
                <div className="p-3 border-r border-neutral-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Your Changes (Local)
                  </h4>
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    Server Version
                  </h4>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {changedFields.map((field, idx) => {
                  const localVal = conflict.localData?.[field];
                  const serverVal = conflict.serverData?.[field];
                  const isDifferent = JSON.stringify(localVal) !== JSON.stringify(serverVal);

                  return (
                    <div
                      key={field}
                      className={`grid grid-cols-2 border-t border-neutral-200 dark:border-neutral-700 ${
                        isDifferent ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <div className="p-3 border-r border-neutral-200 dark:border-neutral-700">
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                          {field}
                        </div>
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {renderValue(localVal)}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                          {field}
                        </div>
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {renderValue(serverVal)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-neutral-50 dark:bg-neutral-800 px-6 py-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!selectedResolution || resolving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-medium
                       hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {resolving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Resolving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resolve Conflict
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
