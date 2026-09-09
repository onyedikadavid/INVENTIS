'use client';

import { useState, useEffect } from 'react';
import { calculateDailyMetrics } from '@/lib/storage';
import { fetchReports, fetchProducts, fetchExpenses, createExpense, updateExpense, deleteExpense, createDailySale } from '@/lib/apiClient';
import { useCurrency } from '@/lib/useCurrency';
import ProtectedRoute from '@/components/ProtectedRoute';

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const titleStyle = {
  fontSize: '24px',
  color: 'var(--text-primary)',
  fontWeight: 700,
};

const subtitleStyle = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const dashboardStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '20px',
  marginBottom: '12px',
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

const mainContentStyle = {
  display: 'grid',
  gridTemplateColumns: '3fr 1.2fr',
  gap: '20px',
};

const tableContainerStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  overflow: 'hidden',
};

const tableHeaderStyle = {
  padding: '20px 24px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
};

const tableTitleStyle = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontWeight: 700,
};

const actionButtonStyle = {
  appearance: 'none',
  border: '1px solid var(--primary-gold)',
  background: 'var(--primary-gold)',
  color: '#101010',
  padding: '10px 14px',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
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

const widgetValueStyle = {
  fontSize: '24px',
  color: 'var(--primary-gold)',
  fontWeight: 700,
  textAlign: 'center',
  padding: '16px',
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

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const formFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '10px 12px',
  color: 'var(--text-primary)',
};

const expenseTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '12px',
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
      return '● High';
    case 'medium':
      return '● Medium';
    case 'low':
      return '● Low';
    default:
      return '● Unknown';
  }
};

const parseDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value;
};

export default function DailyReportsPage() {
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userRole, setUserRole] = useState('owner');
  const [expenseForm, setExpenseForm] = useState({
    id: null,
    description: '',
    category: 'Operations',
    amount: '',
    date: parseDate(new Date().toISOString().slice(0, 10)),
  });
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { symbol, currency } = useCurrency();
  const isSalesRep = userRole === 'sales_rep';

  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleItems, setSaleItems] = useState([{ id: Date.now(), productId: '', qty: '', sellPrice: '' }]);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState('');

  const metrics = calculateDailyMetrics({ products, expenses, currency });

  useEffect(() => {
    const loadData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserRole(parsed.role || 'owner');
        } catch {
          setUserRole('owner');
        }
      }

      try {
        const [allReports, allProducts, allExpenses] = await Promise.all([
          fetchReports(),
          fetchProducts(),
          fetchExpenses(),
        ]);

        setReports(allReports);
        setProducts(allProducts);
        setExpenses(allExpenses);
      } catch (error) {
        setLoadError(error.message || 'Could not load report data from the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const topSellingProducts = products
    .slice()
    .sort((a, b) => {
      const aSold = Number(a?.stockSold || 0);
      const bSold = Number(b?.stockSold || 0);
      return bSold - aSold;
    })
    .slice(0, 5);

  const handleExpenseChange = (field, value) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      id: null,
      description: '',
      category: 'Operations',
      amount: '',
      date: parseDate(new Date().toISOString().slice(0, 10)),
    });
    setIsExpenseFormOpen(false);
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount);
    if (!expenseForm.description || !expenseForm.date || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const payload = {
      description: expenseForm.description,
      category: expenseForm.category,
      amount,
      date: expenseForm.date,
      addedByRole: userRole,
    };

    try {
      if (expenseForm.id) {
        const updatedExpense = await updateExpense(expenseForm.id, payload);
        setExpenses((prev) => prev.map((item) => (item.id === updatedExpense.id ? updatedExpense : item)));
      } else {
        const createdExpense = await createExpense(payload);
        setExpenses((prev) => [...prev, createdExpense]);
      }
      resetExpenseForm();
    } catch (error) {
      alert(error.message || 'Could not save the expense.');
    }
  };

  const handleEditExpense = (expense) => {
    setExpenseForm({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount ?? 0),
      date: expense.date || parseDate(new Date().toISOString().slice(0, 10)),
    });
    setIsExpenseFormOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    const previous = expenses;
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId)); // optimistic
    try {
      await deleteExpense(expenseId);
    } catch (error) {
      setExpenses(previous);
      alert(error.message || 'Could not delete the expense.');
    }
  };

  const handleAddSaleRow = () => {
    setSaleItems((prev) => [...prev, { id: Date.now(), productId: '', qty: '', sellPrice: '' }]);
  };

  const handleRemoveSaleRow = (id) => {
    setSaleItems((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const handleSaleRowChange = (id, field, value) => {
    setSaleItems((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      // Picking a product auto-fills its current selling price, but it stays editable.
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        if (product) {
          updated.sellPrice = String(parseFloat(product.sellPrice?.replace?.(/[^0-9.-]/g, '') || 0) || '');
        }
      }
      return updated;
    }));
  };

  const calculateSaleTotal = () => {
    return saleItems.reduce((sum, row) => {
      const qty = Number(row.qty) || 0;
      const price = Number(row.sellPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const resetSaleForm = () => {
    setSaleItems([{ id: Date.now(), productId: '', qty: '', sellPrice: '' }]);
    setSaleDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmitDailySale = async (event) => {
    event.preventDefault();
    setSaleError('');

    const validRows = saleItems.filter((row) => row.productId && Number(row.qty) > 0);
    if (validRows.length === 0) {
      setSaleError('Add at least one product with a quantity sold.');
      return;
    }

    setIsSubmittingSale(true);
    try {
      const payload = validRows.map((row) => ({
        productId: row.productId,
        qty: Number(row.qty),
        sellPrice: row.sellPrice !== '' ? Number(row.sellPrice) : undefined,
      }));

      await createDailySale(saleDate, payload);

      // Both inventory and the report list changed server-side — reload both.
      const [freshProducts, freshReports] = await Promise.all([fetchProducts(), fetchReports()]);
      setProducts(freshProducts);
      setReports(freshReports);
      resetSaleForm();
    } catch (error) {
      setSaleError(error.message || 'Could not record the sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={['owner', 'sales_rep']}>
      <div style={pageStyle}>
        <div style={headerContainerStyle}>
          <h1 style={titleStyle}>Daily Reports</h1>
          <p style={subtitleStyle}>Daily summary · revenue, expense tracking, and net profit</p>
        </div>

        {loadError && (
          <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px' }}>
            {loadError}
          </div>
        )}

        <div style={widgetStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={widgetTitleStyle}>Record Today's Sales</div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Pick what was sold and how many — this comes straight out of stock.
          </p>

          {saleError && (
            <div style={{ padding: '10px 14px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px' }}>
              {saleError}
            </div>
          )}

          <form onSubmit={handleSubmitDailySale} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={formFieldStyle}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</span>
              <input
                style={{ ...inputStyle, maxWidth: '220px' }}
                type="date"
                value={saleDate}
                onChange={(event) => setSaleDate(event.target.value)}
                required
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {saleItems.map((row) => {
                const rowTotal = (Number(row.qty) || 0) * (Number(row.sellPrice) || 0);
                return (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Product</span>
                      <select
                        style={inputStyle}
                        value={row.productId}
                        onChange={(event) => handleSaleRowChange(row.id, 'productId', event.target.value)}
                        required
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.inStock} in stock)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Qty Sold</span>
                      <input
                        style={inputStyle}
                        type="number"
                        min="1"
                        value={row.qty}
                        onChange={(event) => handleSaleRowChange(row.id, 'qty', event.target.value)}
                        required
                      />
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sell Price ({symbol})</span>
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.sellPrice}
                        onChange={(event) => handleSaleRowChange(row.id, 'sellPrice', event.target.value)}
                        required
                      />
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</span>
                      <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: 'transparent' }}>
                        {symbol}{rowTotal.toLocaleString()}
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSaleRow(row.id)}
                      style={{ background: 'transparent', border: '1px solid #d75959', color: '#f29c9c', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', height: 'fit-content' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={handleAddSaleRow} style={{ ...actionButtonStyle, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                + Add Product
              </button>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-gold)' }}>
                Total Sales: {symbol}{calculateSaleTotal().toLocaleString()}
              </div>
            </div>

            <button type="submit" style={actionButtonStyle} disabled={isSubmittingSale}>
              {isSubmittingSale ? 'Recording...' : 'Submit Daily Sales'}
            </button>
          </form>
        </div>

        {!isSalesRep && (
          <div style={dashboardStyle}>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>TOTAL REVENUE</div>
              <div style={kpiValueStyle}>{metrics.totalRevenue}</div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>TOTAL EXPENSES</div>
              <div style={kpiValueStyle}>{metrics.totalExpenses}</div>
            </div>
            <div style={kpiCardStyle}>
              <div style={kpiLabelStyle}>NET PROFIT</div>
              <div style={kpiValueStyle}>{metrics.grossProfit}</div>
            </div>
          </div>
        )}

        <div style={mainContentStyle}>
          <div style={tableContainerStyle}>
            <div style={tableHeaderStyle}>
              <div style={tableTitleStyle}>Daily Metrics</div>
            </div>
            <table style={tableStyle}>
              <thead style={tableHeadRowStyle}>
                <tr>
                  <th style={tableHeadCellStyle}>Product</th>
                  <th style={tableHeadCellStyle}>Category</th>
                  {!isSalesRep && <th style={tableHeadCellStyle}>Buy</th>}
                  <th style={tableHeadCellStyle}>Sell</th>
                  <th style={tableHeadCellStyle}>Stock Sold</th>
                  {!isSalesRep && <th style={tableHeadCellStyle}>Profit</th>}
                  <th style={tableHeadCellStyle}>Status</th>
                  <th style={tableHeadCellStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td style={tableBodyCellStyle}>{report.product}</td>
                      <td style={tableBodyCellStyle}>{report.category}</td>
                      {!isSalesRep && <td style={tableBodyCellStyle}>{report.buy}</td>}
                      <td style={tableBodyCellStyle}>{report.sell}</td>
                      <td style={tableBodyCellStyle}>{report.stockSold}</td>
                      {!isSalesRep && <td style={tableBodyCellStyle}>{report.profit}</td>}
                      <td style={getStatusStyle(report.status)}>{getStatusDisplay(report.status)}</td>
                      <td style={tableBodyCellStyle}>{report.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isSalesRep ? 6 : 8} style={{ ...tableBodyCellStyle, textAlign: 'center' }}>
                      No daily reports available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={widgetStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={widgetTitleStyle}>Expense Tracker</div>
                <button type="button" style={actionButtonStyle} onClick={() => setIsExpenseFormOpen(true)}>
                  + Add Expense
                </button>
              </div>

              {isExpenseFormOpen && (
                <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={formGridStyle}>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Description</span>
                      <input
                        style={inputStyle}
                        value={expenseForm.description}
                        onChange={(event) => handleExpenseChange('description', event.target.value)}
                        placeholder="Transport, utilities, rent..."
                        required
                      />
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category</span>
                      <select
                        style={inputStyle}
                        value={expenseForm.category}
                        onChange={(event) => handleExpenseChange('category', event.target.value)}
                      >
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Shipping">Shipping</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount</span>
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(event) => handleExpenseChange('amount', event.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </label>
                    <label style={formFieldStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</span>
                      <input
                        style={inputStyle}
                        type="date"
                        value={expenseForm.date}
                        onChange={(event) => handleExpenseChange('date', event.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={actionButtonStyle}>{expenseForm.id ? 'Save Expense' : 'Add Expense'}</button>
                    <button type="button" onClick={resetExpenseForm} style={{ ...actionButtonStyle, background: 'transparent', color: 'var(--text-primary)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <table style={expenseTableStyle}>
                <thead style={tableHeadRowStyle}>
                  <tr>
                    <th style={tableHeadCellStyle}>Description</th>
                    <th style={tableHeadCellStyle}>Amount</th>
                    <th style={tableHeadCellStyle}>Date</th>
                    <th style={tableHeadCellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td style={tableBodyCellStyle}>{expense.description}</td>
                        <td style={tableBodyCellStyle}>{symbol}{Number(expense.amount || 0).toLocaleString()}</td>
                        <td style={tableBodyCellStyle}>{expense.date}</td>
                        <td style={tableBodyCellStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => handleEditExpense(expense)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteExpense(expense.id)} style={{ background: 'transparent', border: '1px solid #d75959', color: '#f29c9c', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ ...tableBodyCellStyle, textAlign: 'center' }}>
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isSalesRep && (
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
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}