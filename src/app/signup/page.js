'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [selectedRole, setSelectedRole] = useState('owner'); // State stores 'owner' or 'sales'
  const [currency, setCurrency] = useState('NGN');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: selectedRole, // Sends matching clean context tokens ('owner' / 'sales')
          ...(selectedRole === 'owner' ? { currency } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Sign up failed');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Owners land on the financial dashboard; sales reps go straight to
      // their workspace since they can't see the dashboard at all.
      if (selectedRole === 'owner') {
        router.push('/dashboard');
      } else {
        router.push('/stock-control');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authTitle}>
            <span className={styles.welcome}>WELCOME TO</span>
            <span className={styles.brand}>INVENTIS</span>
          </div>
        </div>

        <h2 className={styles.formTitle}>SIGN-UP</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.roleSection}>
            <p className={styles.roleLabel}>Account status:</p>
            <div className={styles.roleSelector}>
              <button
                type="button"
                className={`${styles.roleButton} ${
                  selectedRole === 'owner' ? styles.active : ''
                }`}
                onClick={() => setSelectedRole('owner')}
              >
                Owner
              </button>
              <span className={styles.orLabel}>OR</span>
              <button
                type="button"
                className={`${styles.roleButton} ${
                  selectedRole === 'sales_rep' ? styles.active : ''
                } ${selectedRole === 'sales_rep' ? styles.salesRep : ''}`}
                onClick={() => setSelectedRole('sales_rep')}
              >
                Sales Rep
              </button>
            </div>
          </div>

          {selectedRole === 'owner' && (
            <div className={styles.roleSection}>
              <p className={styles.roleLabel}>Business currency:</p>
              <div className={styles.roleSelector}>
                <button
                  type="button"
                  className={`${styles.roleButton} ${currency === 'NGN' ? styles.active : ''}`}
                  onClick={() => setCurrency('NGN')}
                >
                  ₦ Naira
                </button>
                <span className={styles.orLabel}>OR</span>
                <button
                  type="button"
                  className={`${styles.roleButton} ${currency === 'USD' ? styles.active : ''}`}
                  onClick={() => setCurrency('USD')}
                >
                  $ Dollar
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loadingSpinner}></span>
            ) : (
              'SIGN-UP'
            )}
          </button>
        </form>

        <div className={styles.authLink}>
          Already have an account?{' '}
          <Link href="/signin">Sign In</Link>
        </div>
      </div>
    </div>
  );
}