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

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    author: 'Elara Vance',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANaySohrICL0S5yawnlvaCOR9RdE2XM2YsNxClzbsdO2MkdCpa7nXRsfPNJiw3F1L-IUhA7ehxIUXHbMgL1NdMYbgSRn-DnyGxI1Sxz-uOvElRUKtMkB_fQ5U_IXMydo7FLv24GTCaQgn36H15PyLsFHXE06OZy-85_wnOO7Izcs0FGowZu8wfoZnH9eOi7S5YTP-Yg6-Pn3hseS-dPZddEYHjq3CcHFUifuvV2sH95NBcHGbPIi3x1p64ej9hLuhfyghfETcahkU',
    timestamp: 'Posted 2 hours ago',
    content: "Merry Christmas everyone! Hope you all have a wonderful holiday season filled with joy and laughter. Can't wait to see you all at the lunch!"
  },
  {
    id: '2',
    author: 'Ben Carter',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGQMoWb3LVsxrHMjdJS-YkIoRyglDn2w4AFryZkX7_bfXS6XWJWJqBv4VFVe8SlNe_sQenw5rJq84MbVjnJMqdcA1t0p4i2wYzJtSZwkxsxZTDoL4Xi7Q5UqXtgcYtsMGKuLzRTI5OXxUgWr3RG56hByolMhoyZZ9_iJJRhzx90x_aA6Rc8N0RymxXO4cwRzS-6Asy1wneNV_HX25WkqA7qBhj5D6o6K1lFC8ANLwZGIGavPPg8-t8VX2gFr4EW-uzQrht-oNEKig',
    timestamp: 'Posted 5 hours ago',
    content: "Wishing everyone a very Merry Christmas! Looking forward to catching up with everyone. The menu looks amazing!"
  },
  {
    id: '3',
    author: 'Olivia Chen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYMJQd012j5QJGiBnF6kGrWrxl98L7stIXEj9kaxKPUSGlLDDThopnzQsZ19fp38ZQs5PUiLwIFcLRGSH1CYG8WezKC0yJE6hw4PPGkCm_zAM8-bTq6r7pSLxpzpYif-3kHjxiMLx-LxwBtTs4YUOOIsiw1f7MdzaAGh_2om13XZSTtLPcsuXo1Swt9NjYnDKjJYcb_0-fRH0cGBvN2GjCzbMkG5Og23_9u6XAVo-i5jDmyGY4kNWgIZ_2Lzm-DJ_sZTWHzh9gfn8',
    timestamp: 'Posted yesterday',
    content: "Happy holidays S203! May your days be merry and bright. See you all soon!"
  }
];
