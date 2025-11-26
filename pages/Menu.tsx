import React from 'react';
import { MENU_DATA } from '../constants';

const Menu: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 py-10 max-w-5xl mx-auto px-4 w-full">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">
          Christmas Lunch Menu
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-sans">
          A festive feast to celebrate the season. Please let us know of any dietary requirements
          when you RSVP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MENU_DATA.map((category, idx) => (
          <div
            key={category.title}
            className={`flex flex-col gap-4 ${
              // Make Main Courses span full width on medium screens if it's the second item (index 1) just for layout variety,
              // or keep grid consistent. Let's make Main Courses span 2 cols if needed, but standard grid is cleaner.
              idx === 1 ? 'md:col-span-2' : ''
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2 px-2">
              {category.title}
            </h2>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${category.colorClass}`}
                      >
                        <category.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    {item.tags && (
                      <div className="flex flex-col sm:flex-row gap-1 shrink-0 mt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                              tag === 'VG'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : tag === 'GF'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dietary Legend */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="font-bold text-gray-800">Dietary Information</h3>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center border border-purple-100">
                V
              </span>
              Vegetarian
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                VG
              </span>
              Vegan
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-50 text-green-600 font-bold text-xs flex items-center justify-center border border-green-100">
                GF
              </span>
              Gluten-Free
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            For severe allergies, please contact the committee directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;