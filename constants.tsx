import { Leaf, Soup, UtensilsCrossed, Fish, Info, Cake, IceCream, Wine, GlassWater } from 'lucide-react';
import { MenuCategory, Message } from './types';

export const MENU_DATA: MenuCategory[] = [
  {
    title: "Starters",
    icon: Leaf,
    colorClass: "text-emerald-500 bg-emerald-500/10",
    items: [
      {
        name: "Winter Wonderland Salad",
        description: "Mixed greens, cranberries, candied pecans, and a light vinaigrette.",
        tags: ["VG", "GF"]
      },
      {
        name: "Creamy Tomato & Basil Soup",
        description: "A rich, hearty soup served with a crusty bread roll.",
        tags: ["V"]
      }
    ]
  },
  {
    title: "Main Courses",
    icon: UtensilsCrossed,
    colorClass: "text-amber-600 bg-amber-600/10",
    items: [
      {
        name: "Roast Turkey with all the Trimmings",
        description: "Served with roast potatoes, stuffing, pigs in blankets, and gravy.",
      },
      {
        name: "Honey-Glazed Salmon",
        description: "Pan-seared salmon fillet with an asparagus and new potato medley.",
        tags: ["GF"]
      },
      {
        name: "Mushroom & Chestnut Wellington",
        description: "A festive vegan pastry served with roasted root vegetables.",
        tags: ["VG"]
      }
    ]
  },
  {
    title: "Desserts",
    icon: Cake,
    colorClass: "text-pink-500 bg-pink-500/10",
    items: [
      {
        name: "Christmas Pudding",
        description: "Served with brandy butter.",
        tags: ["V"]
      },
      {
        name: "White Chocolate Cheesecake",
        description: "With a winter berry coulis.",
        tags: ["V"]
      }
    ]
  },
  {
    title: "Beverages",
    icon: Wine,
    colorClass: "text-red-500 bg-red-500/10",
    items: [
      {
        name: "Festive Non-Alcoholic Punch",
        description: "Cranberry, orange & spices.",
      },
      {
        name: "Assorted Juices & Soft Drinks",
        description: "Orange, Apple, Cola, Lemonade.",
      }
    ]
  }
];

export const INITIAL_MESSAGES: Message[] = [];
