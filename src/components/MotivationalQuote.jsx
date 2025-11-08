import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';

const motivationalQuotes = {
  en: [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  ],
  te: [
    { text: "మీరు చేయగలరని నమ్మితే, మీరు సగం దూరం వచ్చేశారు.", author: "థియోడర్ రూజ్‌వెల్ట్" },
    { text: "మీ సమయం పరిమితం, ఇతరుల జీవితాన్ని గడపడానికి దాన్ని వృథా చేయకండి.", author: "స్టీవ్ జాబ్స్" },
    { text: "గొప్ప పని చేయడానికి ఏకైక మార్గం మీరు చేసే పనిని ప్రేమించడం.", author: "స్టీవ్ జాబ్స్" },
    { text: "మీరు ఎంత నెమ్మదిగా వెళ్తున్నారో పట్టింపు లేదు, మీరు ఆగకుండా ఉండండి.", author: "కన్ఫ్యూషియస్" },
    { text: "భవిష్యత్తు వారి కలల అందాన్ని విశ్వసించే వారికి చెందుతుంది.", author: "ఎలియనోర్ రూజ్‌వెల్ట్" },
    { text: "మీరు ఎప్పుడైనా కోరుకున్నదంతా భయానికి అవతల ఉంది.", author: "జార్జ్ అడ్డైర్" },
    { text: "విజయం అంటే మీరు ఎంత ఎత్తుకు వెళ్లారు కాదు, ప్రపంచానికి మీరు ఎంత సానుకూల మార్పు తెచ్చారు.", author: "రాయ్ టి. బెన్నెట్" },
    { text: "గడియారం చూడకండి; అది చేసేది చేయండి. కొనసాగండి.", author: "సామ్ లెవెన్సన్" },
    { text: "ముందుకు వెళ్లే రహస్యం ప్రారంభించడం.", author: "మార్క్ ట్వైన్" },
    { text: "మీరు పడిపోయారా అనేది ముఖ్యం కాదు, మీరు లేచారా అనేది ముఖ్యం.", author: "విన్స్ లొంబార్డి" },
    { text: "మీరు ప్రారంభించని ప్రయాణం మాత్రమే అసాధ్యం.", author: "టోనీ రాబిన్స్" },
    { text: "మీరు చేసేది తేడా చేస్తుందని భావించండి. అది చేస్తుంది.", author: "విలియం జేమ్స్" },
    { text: "కష్టాలు సాధారణ వ్యక్తులను అసాధారణ గమ్యానికి సిద్ధం చేస్తాయి.", author: "సి.ఎస్. లూయిస్" },
    { text: "కొత్త లక్ష్యం నిర్ణయించుకోవడానికి లేదా కొత్త కల కనడానికి మీరు ఎప్పుడూ చాలా పెద్దవారు కాదు.", author: "సి.ఎస్. లూయిస్" },
    { text: "విజయం అనేది చివరిది కాదు, వైఫల్యం అనేది ప్రాణాంతకం కాదు: కొనసాగించే ధైర్యం ముఖ్యం.", author: "విన్స్టన్ చర్చిల్" },
  ],
};

const MotivationalQuote = ({ className = '', autoRotate = true, rotateInterval = 30000 }) => {
  const { t, language } = useTranslation();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const quotes = motivationalQuotes[language] || motivationalQuotes.en;
  const currentQuote = quotes[currentQuoteIndex];

  useEffect(() => {
    // Get a random quote on mount
    setCurrentQuoteIndex(Math.floor(Math.random() * quotes.length));
  }, [language]);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, quotes.length]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 rounded-2xl border-l-4 border-gradient-to-b from-primary-500 to-aqua-500 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 5,
            }}
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('aiInsights.motivationalQuote')}
          </h3>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
        </motion.button>
      </div>

      <motion.div
        key={currentQuoteIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <p className="text-base text-gray-800 dark:text-gray-200 italic leading-relaxed">
          "{currentQuote.text}"
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          — {currentQuote.author}
        </p>
      </motion.div>

      {/* Decorative gradient line */}
      <motion.div
        className="mt-4 h-1 bg-gradient-to-r from-primary-500 via-aqua-500 to-primary-500 rounded-full"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />
    </motion.div>
  );
};

export default MotivationalQuote;
