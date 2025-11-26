import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Shirt } from 'lucide-react';
import Countdown from '../components/Countdown';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[500px] overflow-hidden rounded-2xl shadow-lg mx-auto max-w-6xl mt-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAvJhzeKppB_yneN8d2uuu_o3PlHWaUFFYj1mXeHcqU8LZSIKdq3thTgGQaQz4SWYUCc-P83KyjFRniez2uvMDYVNhm5XrVtntSifnmimhhEc4CyS7WxMOaMogEBmZFEi7EBQwONVvWw5jFONOdW9lPqSmuneCuQuUWhQckqfQjDOJVYYKQie6HwmW2dNnY5vHVByVuji9e3JUsuyyzldCldzzh5SJkRLqI194OYZgF5FyeF92vgTD9DHaDnj7MiQwGRIuFm273FZ8')`,
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary/90 flex flex-col items-center justify-center text-center p-6 sm:p-12">
            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-serif font-black mb-4 tracking-tight drop-shadow-sm">
              S203 Presents:
              <br />
              Christmas in White
            </h1>
            <p className="text-gray-200 text-lg sm:text-xl font-light mb-8 max-w-2xl">
              An evening of festive celebration
            </p>
            <Link
              to="/rsvp"
              className="px-8 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-md text-lg"
            >
              RSVP Now
            </Link>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <Countdown />

      {/* Event Details */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-12">
        <h2 className="text-2xl font-serif font-bold text-primary border-b border-gray-200 pb-4 mb-6">
          Event Details
        </h2>
        
        <p className="text-gray-700 leading-relaxed text-lg mb-8 max-w-3xl">
          Join us for a magical evening as we celebrate the festive season. The "Christmas in White"
          party promises a night of joy, laughter, and unforgettable memories. Get ready for delightful
          food, great company, and a touch of winter wonder. We can't wait to see you there!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:border-accent transition-colors">
            <div className="text-primary">
              <Calendar size={32} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary mb-1">Date & Time</h3>
              <p className="text-gray-600">December 12, 2025 at 12:00 PM</p>
            </div>
          </div>

          {/* Venue Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:border-accent transition-colors">
            <div className="text-primary">
              <MapPin size={32} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary mb-1">Venue</h3>
              <p className="text-gray-600">AX305</p>
            </div>
          </div>

          {/* Dress Code Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:border-accent transition-colors">
            <div className="text-primary">
              <Shirt size={32} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary mb-1">Dress Code</h3>
              <p className="text-gray-600">Elegant White & Blue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
