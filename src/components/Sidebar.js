'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar({ userRole }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/signin');
  };

  const isOwner = userRole === 'owner';

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoText}>INVENTIS</div>
        <div className={styles.logoSubtext}>INVENTORY SUITE</div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>DASHBOARD</div>
          {isOwner && (
            <Link href="/dashboard" className={styles.navLink}>
              <span className={styles.icon}>▦</span>
              <span>Overview</span>
            </Link>
          )}
          <Link href="/products" className={styles.navLink}>
            <span className={styles.icon}>≡</span>
            <span>Products</span>
          </Link>
        </div>

        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>Operations</div>
          <Link href="/stock-control" className={styles.navLink}>
            <span className={styles.icon}>●</span>
            <span>Stock Control</span>
          </Link>
          <Link href="/e-receipt" className={styles.navLink}>
            <span className={styles.icon}>■</span>
            <span>E-Receipt</span>
          </Link>
        </div>

        <div className={styles.navSection}>
          <div className={styles.sectionTitle}>Analytics</div>
          <Link href="/daily-reports" className={styles.navLink}>
            <span className={styles.icon}>◇</span>
            <span>Daily Reports</span>
          </Link>
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}></div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('user') || '{}').name || 'User'
                : 'User'}
            </div>
            <div className={styles.userRole}>
              {isOwner ? 'Full Access' : 'Sales Rep'}
            </div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
