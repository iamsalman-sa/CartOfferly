import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export default function UrgencyTimer() {
  const [timeLeft, setTimeLeft] = useState(24 * 60 + 53); // 24:53 in seconds
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-3 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <p className="font-semibold" data-testid="timer-expired">
            Offer has expired! Add more items to unlock rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="text-white w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400" data-testid="timer-message">
              Hurry! Choose your free products
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              Offer expires soon
            </p>
          </div>
        </div>
        <div className="text-right">
          <div 
            className="text-2xl font-bold text-red-700 dark:text-red-400 font-mono"
            data-testid="timer-display"
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-xs text-red-600 dark:text-red-500">Minutes left</p>
        </div>
      </div>
    </div>
  );
}
