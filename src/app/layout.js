'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import "@/styles/auth.css";
import "@/styles/dashboard.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: 'var(--dark-bg, #121212)',
};

const mainContentStyle = {
  flex: 1,
  marginLeft: '250px',
  padding: '40px',
  overflowY: 'auto',
  minWidth: 0,
};

export default function RootLayout({ children }) {
  const [userRole, setUserRole] = useState('sales');
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role) setUserRole(parsed.role);
      }
    } catch (e) {
      console.error("Failed to load user session context", e);
    }
  }, []);

  // Included '/signup' here so it renders full-screen without the sidebar frame
  const authRoutes = ['/signin', '/signup', '/unauthorized'];
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        {isAuthPage ? (
          /* Clean full-width window layout for onboarding paths */
          children
        ) : (
          /* Operational dashboard layout frame with pinned sidebar */
          <div style={layoutStyle}>
            <Sidebar userRole={userRole} />
            <main style={mainContentStyle} className="app-main-content">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}