"use client"
import React, { useState } from "react";
import Link from "next/link";

// Simple SVG icons
const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
  </svg>
);

const menuItems = [
  { name: "Home", href: "/" },
  { name: "Design", href: "/design" },
  { name: "Code", href: "/code" },
  { name: "Test", href: "/test" },
  { name: "Deploy", href: "/deploy" },
];

const Header = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 bg-white/80 shadow-md ring-1 ring-gray-200">
        {/* Logo Placeholder */}
        <div className="font-bold text-2xl text-indigo-700 tracking-wide select-none">
          AgenticLab 360
        </div>
        {/* Menu Items */}
        <nav>
          <ul className="flex gap-6 items-center">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-gray-700 font-medium px-3 py-2 rounded transition-colors duration-200 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {item.name}
                </Link>
              </li>
            ))}
            {/* Profile Icon */}
            <li>
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Profile"
                type="button"
              >
                <ProfileIcon />
              </button>
            </li>
            {/* Menu Icon */}
            <li>
              <button
                onClick={() => setShowMenu(true)}
                className="p-2 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Menu"
                type="button"
              >
                <MenuIcon />
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Profile Dialog */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <p className="mb-6 text-gray-600">User profile details go here.</p>
            <button
              onClick={() => setShowProfile(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Menu Dialog */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Menu</h2>
            <ul className="mb-6 space-y-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-indigo-700 hover:underline"
                    onClick={() => setShowMenu(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowMenu(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;