/**
 * Password Strength Indicator Component
 * 
 * Visual password strength meter with real-time feedback.
 * Shows strength level (weak/medium/strong) and specific requirements.
 * 
 * Business Rules:
 * - Weak (0-2): Less than 8 chars or missing requirements
 * - Medium (3-4): 8+ chars with some complexity
 * - Strong (5-6): 12+ chars with all complexity (uppercase, lowercase, number, special)
 * 
 * Usage:
 * ```jsx
 * <PasswordStrength password={password} />
 * ```
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, AlertCircle } from 'lucide-react';
import { calculatePasswordStrength } from '../lib/validation';

const PasswordStrength = ({ password = '', showRequirements = true, className = '' }) => {
  // Calculate strength
  const strength = useMemo(() => {
    if (!password) return { score: 0, level: 'none' };
    return calculatePasswordStrength(password);
  }, [password]);
  
  // Calculate individual requirements
  const requirements = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
      isLongEnough: password.length >= 12,
    };
  }, [password]);
  
  // Strength colors
  const strengthConfig = {
    none: {
      color: 'bg-gray-300 dark:bg-gray-600',
      textColor: 'text-gray-500 dark:text-gray-400',
      label: 'Enter password',
      icon: Shield,
    },
    weak: {
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      label: 'Weak',
      icon: AlertCircle,
    },
    medium: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      label: 'Medium',
      icon: Shield,
    },
    strong: {
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      label: 'Strong',
      icon: Shield,
    },
  };
  
  const config = strengthConfig[strength.level];
  const Icon = config.icon;
  
  // Calculate width percentage
  const widthPercentage = strength.level === 'none' ? 0 : (strength.score / 6) * 100;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.textColor}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
              Password Strength: {config.label}
            </span>
          </div>
          {strength.level !== 'none' && (
            <span className={`text-xs font-medium ${config.textColor}`}>
              {strength.score}/6
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${config.color} rounded-full transition-all duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Requirements checklist */}
      {showRequirements && password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Password must contain:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <RequirementItem
              met={requirements.minLength}
              label="At least 8 characters"
            />
            <RequirementItem
              met={requirements.hasUppercase}
              label="Uppercase letter"
            />
            <RequirementItem
              met={requirements.hasLowercase}
              label="Lowercase letter"
            />
            <RequirementItem
              met={requirements.hasNumber}
              label="Number"
            />
            <RequirementItem
              met={requirements.hasSpecial}
              label="Special character (!@#$%)"
              optional
            />
            <RequirementItem
              met={requirements.isLongEnough}
              label="12+ characters"
              optional
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

const RequirementItem = ({ met, label, optional = false }) => {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      )}
      <span
        className={`text-xs ${
          met
            ? 'text-green-600 dark:text-green-400 font-medium'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
        {optional && <span className="text-gray-400 ml-1">(optional)</span>}
      </span>
    </div>
  );
};

export default PasswordStrength;
