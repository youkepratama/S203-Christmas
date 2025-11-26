import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let targetDate = new Date(`December 24, ${currentYear} 19:00:00`);

      // If already past this year's date, aim for next year
      if (now.getTime() > targetDate.getTime()) {
        targetDate = new Date(`December 24, ${currentYear + 1} 19:00:00`);
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial call

    return () => clearInterval(timer);
  }, []);

  const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center gap-3 flex-1 min-w-[80px]">
      <div className="w-full aspect-square max-h-24 sm:max-h-28 flex items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <span className="text-2xl sm:text-4xl font-serif font-bold text-primary">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-sm text-gray-600 uppercase tracking-wide font-medium">{label}</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-4 justify-between">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

export default Countdown;