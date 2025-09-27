'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Sun, Moon, User, Settings, LogOut, Calendar, MessageSquare, Blocks, Zap, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthContext } from '@/lib/providers/auth-provider';
import Link from 'next/link';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuthContext();

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation items based on authentication status
  const navigation = user ? [
    { name: 'Home', href: '/' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Docs', href: '/docs' },
    { name: 'Notes', href: '/notes' },
    { name: 'Knowledge Base', href: '/knowledge' },
    { name: 'Settings', href: '/settings' },
  ] : [
    { name: 'Home', href: '/' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Docs', href: '/docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80" suppressHydrationWarning>
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">BeQ</span>
            <div className="flex items-center space-x-2">
              <img
                src="/beq-logo.png"
                alt="BeQ Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Bricks & Quantas
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button and notifications */}
        <div className={`flex lg:hidden${mounted && user ? ' items-center gap-2' : ''}`}>
          {/* Mobile notifications */}
          {mounted && user && (
            <button
              className="relative -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
              title="Notifications"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
          )}
          
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12" suppressHydrationWarning>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              suppressHydrationWarning
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <span className="sr-only">Toggle theme</span>
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : (
              <div className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          {mounted && user && (
            <div className="relative">
              <button
                className="relative rounded-md p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Notifications"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          )}

          {/* User menu */}
          {mounted ? (
            user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-x-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
                  suppressHydrationWarning
                >
                  <User className="h-4 w-4" />
                  <span suppressHydrationWarning>
                    {user?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </button>

              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
                >
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/bricks"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Blocks className="h-4 w-4" />
                    Bricks
                  </Link>
                  <Link
                    href="/quantas"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Quantas
                  </Link>
                  <Link
                    href="/calendar"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </Link>
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
              </div>
            ) : (
              <div className="flex items-center gap-x-4">
                <Link
                  href="/auth"
                  className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )
          ) : (
            <div className="h-10 w-20" /> // Placeholder to maintain layout
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden"
          suppressHydrationWarning
        >
          <div className="space-y-2 px-6 pb-6 pt-2" suppressHydrationWarning>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
                suppressHydrationWarning
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              {mounted && user && (
                <div className="mb-4">
                  <button
                    className="relative -mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800 w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Bell className="h-5 w-5" />
                    Notifications
                    {/* Notification badge */}
                    <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      3
                    </span>
                  </button>
                </div>
              )}
              {mounted ? (
                user ? (
                  <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                    <Link
                      href="/bricks"
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                      onClick={() => setIsOpen(false)}
                    >
                      <Blocks className="h-5 w-5" />
                      Bricks
                    </Link>
                    <Link
                      href="/quantas"
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                      onClick={() => setIsOpen(false)}
                    >
                      <Zap className="h-5 w-5" />
                      Quantas
                    </Link>
                  <Link
                    href="/calendar"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Calendar
                  </Link>
                  <Link
                    href="/chat"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Chat
                  </Link>
                  <Link
                    href="/settings"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  >
                    Sign out
                  </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                      onClick={() => setIsOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white bg-primary-600 hover:bg-primary-500"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )
              ) : (
                <div className="h-10" /> // Placeholder
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
