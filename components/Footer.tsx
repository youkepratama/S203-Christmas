import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
        <p className="flex items-center gap-1 text-sm text-gray-500">
          Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for S203
        </p>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} S203 Christmas Committee
        </p>
      </div>
    </footer>
  );
};

export default Footer;