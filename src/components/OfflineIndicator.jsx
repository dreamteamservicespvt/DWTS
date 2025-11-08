import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import offlineManager from '../utils/offlineManager';

const OfflineIndicator = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleStatusChange = async (event) => {
      if (event.type === 'online') {
        setIsOnline(true);
      } else if (event.type === 'offline') {
        setIsOnline(false);
      } else if (event.type === 'syncStart') {
        setSyncing(true);
      } else if (event.type === 'syncComplete') {
        setSyncing(false);
        setPendingSync(0);
      } else if (event.type === 'pendingSync') {
        setPendingSync((prev) => prev + event.count);
      }
    };

    offlineManager.addListener(handleStatusChange);

    // Get initial pending sync count
    offlineManager.getPendingSync().then((items) => {
      setPendingSync(items.length);
    });

    return () => {
      offlineManager.removeListener(handleStatusChange);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || pendingSync > 0 || syncing) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div
            className={`px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 ${
              !isOnline
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : syncing
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">{t('common.offline')}</span>
                {pendingSync > 0 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {pendingSync} pending
                  </span>
                )}
              </>
            ) : syncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">Syncing...</span>
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5" />
                <span className="font-medium">{t('common.syncComplete')}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
