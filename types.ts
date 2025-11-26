import type React from "react";

export interface MenuItem {
  name: string;
  description: string;
  tags?: ('VG' | 'V' | 'GF')[];
}

export interface MenuCategory {
  title: string;
  items: MenuItem[];
  icon: React.ElementType;
  colorClass: string;
}

export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface RSVPFormData {
  fullName: string;
  email: string;
  attendance: 'yes' | 'no' | null;
}
