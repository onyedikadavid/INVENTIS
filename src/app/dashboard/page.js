'use client';

import { useState, useEffect } from 'react';
import { calculateDailyMetrics, calculateCapital } from '@/lib/storage';
import { fetchProducts, fetchExpenses } from '@/lib/apiClient';
import { useCurrency } from '@/lib/useCurrency';
import ProtectedRoute from '@/components/ProtectedRoute';

const dashboardStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '20px',
  marginBottom: '30px',
};

const kpiCardStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const kpiLabelStyle = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

const kpiValueStyle = {
  fontSize: '28px',
  color: 'var(--primary-gold)',
  fontWeight: 700,
};

const tableContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '3fr 1fr',
  gap: '20px',
};

const tableWrapperStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  overflow: 'hidden',
};

const tableHeaderStyle = {
  padding: '20px 24px',
  borderBottom: '1px solid var(--border-color)',
};

const tableTitleStyle = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontWeight: 700,
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableHeadRowStyle = {
  background: 'var(--primary-dark)',
  borderBottom: '1px solid var(--border-color)',
};

const tableHeadCellStyle = {
  padding: '16px 24px',
  textAlign: 'left',
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

const tableBodyCellStyle = {
  padding: '16px 24px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border-color)',
};

const statusHighStyle = {
  ...tableBodyCellStyle,
  backgroundColor: 'rgba(0, 204, 0, 0.1)',
  color: 'var(--status-success)',
  fontWeight: 600,
};

const statusMediumStyle = {
  ...tableBodyCellStyle,
  backgroundColor: 'rgba(255, 184, 28, 0.1)',
  color: 'var(--status-warning)',
  fontWeight: 600,
};

const statusLowStyle = {
  ...tableBodyCellStyle,
  backgroundColor: 'rgba(255, 51, 51, 0.1)',
  color: 'var(--status-danger)',
  fontWeight: 600,
};

const widgetStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const widgetTitleStyle = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontWeight: 700,
};

const widgetListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const widgetItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'var(--primary-dark)',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
};

const widgetItemNameStyle = {
  fontSize: '13px',
  color: 'var(--text-primary)',
  fontWeight: 600,
};

const widgetItemValueStyle = {
  fontSize: '13px',
  color: 'var(--primary-gold)',
  fontWeight: 700,
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'high':
      return statusHighStyle;
    case 'medium':
      return statusMediumStyle;
    case 'low':
      return statusLowStyle;
    default:
      return tableBodyCellStyle;
  }
};

const getStatusDisplay = (status) => {
  switch (status) {
    case 'high':
      return '●';
    case 'medium':
      return '●';
    case 'low':
      return '●';
    default:
      return '●';
  }
};

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [userRole, setUserRole] = useState('owner');

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role) setUserRole(parsed.role);
      }
    } catch (e) {
      console.error('Could not load user role context', e);
    }

    Promise.all([fetchProducts(), fetchExpenses()])
      .then(([productsData, expensesData]) => {
        setProducts(productsData);
        setExpenses(expensesData);
      })
      .catch((error) => setLoadError(error.message || 'Could not load dashboard data from the server.'))
      .finally(() => setIsLoading(false));
  }, []);

  const isSalesRep = userRole === 'sales_rep';
  const { currency } = useCurrency();
  const metrics = calculateDailyMetrics({ products, expenses, currency });
  const capital = calculateCapital(products, currency);

  const topSellingProducts = products
    .slice()
    .sort((a, b) => {
      const aSold = typeof a.stockSold === 'string' ? parseInt(a.stockSold.replace(/\D/g, ''), 10) : a.stockSold;
      const bSold = typeof b.stockSold === 'string' ? parseInt(b.stockSold.replace(/\D/g, ''), 10) : b.stockSold;
      return bSold - aSold;
    })
    .slice(0, 5);

  return (
    <ProtectedRoute requiredRole={['owner']}>
    <div>
      <h1 style={{
        fontSize: '24px',
        color: 'var(--text-primary)',
        fontWeight: 700,
        marginBottom: '24px',
      }}>
        Dashboard Overview
      </h1>

      {loadError && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px', marginBottom: '20px' }}>
          {loadError}
        </div>
      )}

      {/* KPI Cards — owner only; sales reps aren't shown revenue/profit figures */}
      {!isSalesRep && (
        <div style={{ ...dashboardStyle, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>BUSINESS CAPITAL</div>
            <div style={kpiValueStyle}>{isLoading ? '...' : capital}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>TOTAL REVENUE</div>
            <div style={kpiValueStyle}>{isLoading ? '...' : metrics.totalRevenue}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>TOTAL EXPENSES</div>
            <div style={kpiValueStyle}>{isLoading ? '...' : metrics.totalExpenses}</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={kpiLabelStyle}>GROSS PROFIT</div>
            <div style={kpiValueStyle}>{isLoading ? '...' : metrics.grossProfit}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={tableContainerStyle}>
        {/* Product Performance Table */}
        <div style={tableWrapperStyle}>
          <div style={tableHeaderStyle}>
            <div style={tableTitleStyle}>Product Performance</div>
          </div>
          <table style={tableStyle}>
            <thead style={tableHeadRowStyle}>
              <tr>
                <th style={tableHeadCellStyle}>Product</th>
                <th style={tableHeadCellStyle}>Category</th>
                <th style={tableHeadCellStyle}>Buy</th>
                <th style={tableHeadCellStyle}>Sell</th>
                <th style={tableHeadCellStyle}>Qty Remaining</th>
                <th style={tableHeadCellStyle}>Stock Sold</th>
                <th style={tableHeadCellStyle}>Profit</th>
                <th style={tableHeadCellStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={tableBodyCellStyle}>{product.name}</td>
                  <td style={tableBodyCellStyle}>{product.category}</td>
                  <td style={tableBodyCellStyle}>{product.buyPrice}</td>
                  <td style={tableBodyCellStyle}>{product.sellPrice}</td>
                  <td style={tableBodyCellStyle}>{product.inStock}</td>
                  <td style={tableBodyCellStyle}>{product.stockSold}</td>
                  <td style={tableBodyCellStyle}>{product.profit}</td>
                  <td style={getStatusStyle(product.status)}>
                    {getStatusDisplay(product.status)} {product.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Selling Products Widget */}
        <div style={widgetStyle}>
          <div style={widgetTitleStyle}>Top Selling Products</div>
          <div style={widgetListStyle}>
            {topSellingProducts.map((product, index) => (
              <div key={product.id} style={widgetItemStyle}>
                <div>
                  <div style={widgetItemNameStyle}>{index + 1}. {product.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {product.stockSold} sold
                  </div>
                </div>
                <div style={widgetItemValueStyle}>{product.profit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
