// src/components/CartoonWelcome.jsx
import { useState, useEffect } from 'react';

const CartoonWelcome = ({ title, subtitle }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) / 30; // Reduced sensitivity
      const y = (e.clientY - window.innerHeight / 2) / 30; // Reduced sensitivity
      setPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-center justify-center text-white h-full pr-10">
      
      {/* Animated Figures Container */}
      <div className="relative w-96 h-80">

        {/* Figure 1: Person at computer (Foreground - moves more) */}
        <div
          className="absolute bottom-0 left-0 transition-transform duration-500 ease-out z-10"
          style={{ transform: `translateX(${position.x}px) translateY(${position.y}px)` }}
        >
          {/* --- SVG 1 (Unchanged) --- */}
          <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Desk */}
            <rect x="10" y="150" width="180" height="30" rx="5" fill="#1F2937" />
            {/* Chair */}
            <path d="M 60 100 C 55 130, 55 160, 60 180 L 140 180 C 145 160, 145 130, 140 100 Z" fill="#374151" />
            {/* Person's body */}
            <rect x="70" y="70" width="60" height="80" rx="30" fill="#7C3AED" />
            {/* Person's head */}
            <circle cx="100" cy="50" r="25" fill="#A78BFA" />
            {/* Laptop base */}
            <path d="M 30 150 L 170 150 L 160 145 L 40 145 Z" fill="#9CA3AF" />
            {/* Laptop screen back */}
            <rect x="50" y="80" width="100" height="65" rx="5" fill="#9CA3AF" />
            {/* Laptop screen */}
            <rect x="55" y="85" width="90" height="55" rx="2" fill="#111827" />
            {/* Screen content (code/design) */}
            <rect x="60" y="95" width="80" height="4" fill="#34D399" rx="2" />
            <rect x="60" y="105" width="60" height="4" fill="#60A5FA" rx="2" />
            <rect x="60" y="115" width="70" height="4" fill="#F472B6" rx="2" />
            {/* Plant Pot */}
            <rect x="160" y="130" width="25" height="20" rx="4" fill="#4B5563" />
            {/* Plant Leaves */}
            <path d="M 172 130 C 165 120, 165 110, 170 100" stroke="#22C55E" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 172 130 C 180 120, 180 110, 185 105" stroke="#22C55E" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
          {/* --------------------- */}
        </div>

        {/* Figure 2: Abstract Board with Graph (Background - moves less) */}
        <div
          className="absolute top-0 right-0 transition-transform duration-700 ease-out"
          style={{ transform: `translateX(${-position.x * 0.5}px) translateY(${-position.y * 0.5}px)` }}
        >
          {/* --- NEW SVG 2: Board with Graph --- */}
          <svg width="180" height="190" viewBox="0 0 180 190" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Board Background */}
            <rect x="30" y="10" width="120" height="140" rx="10" fill="#E0F2F7" stroke="#9CA3AF" strokeWidth="2" />

            {/* Board Stand - Left */}
            <rect x="45" y="150" width="8" height="30" rx="3" fill="#6B7280" />
            <circle cx="49" cy="180" r="5" fill="#4B5563" />
            {/* Board Stand - Right */}
            <rect x="127" y="150" width="8" height="30" rx="3" fill="#6B7280" />
            <circle cx="131" cy="180" r="5" fill="#4B5563" />

            {/* Graph Area */}
            <rect x="45" y="30" width="90" height="90" rx="5" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
            
            {/* Graph Grid Lines */}
            <line x1="45" y1="90" x2="135" y2="90" stroke="#F3F4F6" strokeWidth="1" />
            <line x1="45" y1="60" x2="135" y2="60" stroke="#F3F4F6" strokeWidth="1" />
            <line x1="75" y1="30" x2="75" y2="120" stroke="#F3F4F6" strokeWidth="1" />
            <line x1="105" y1="30" x2="105" y2="120" stroke="#F3F4F6" strokeWidth="1" />

            {/* Graph Bars */}
            <rect x="50" y="85" width="10" height="30" fill="#3B82F6" rx="2" />
            <rect x="65" y="70" width="10" height="45" fill="#EC4899" rx="2" />
            <rect x="80" y="95" width="10" height="20" fill="#10B981" rx="2" />
            <rect x="95" y="55" width="10" height="60" fill="#FBBF24" rx="2" />
            <rect x="110" y="80" width="10" height="35" fill="#8B5CF6" rx="2" />
            <rect x="125" y="90" width="10" height="25" fill="#EF4444" rx="2" />

            {/* Title / Legend Placeholder */}
            <rect x="45" y="130" width="70" height="8" rx="2" fill="#9CA3AF" />
            <circle cx="125" cy="134" r="3" fill="#3B82F6" />
          </svg>
          {/* ------------------- */}
        </div>
      </div>
      
      {/* Welcome Text */}
      <h2 className="text-4xl font-sans font-bold mt-8 text-center">{title}</h2>
      <p className="text-white font-sans mt-2 text-center">{subtitle}</p>
    </div>
  );
};

export default CartoonWelcome;