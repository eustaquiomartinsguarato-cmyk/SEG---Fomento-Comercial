import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Banknote } from 'lucide-react';

interface GlobalLoaderProps {
  isVisible: boolean;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25" />
              <div className="relative bg-emerald-600 p-5 rounded-full shadow-lg shadow-emerald-200">
                <Banknote className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-slate-800 font-black uppercase tracking-widest text-sm">Processando</p>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
