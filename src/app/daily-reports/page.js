'use client';

import { useState, useEffect } from 'react';
import { calculateDailyMetrics } from '@/lib/storage';
import { fetchProducts, fetchExpenses, createExpense, updateExpense, deleteExpense, fetchDailySummary, updateDailySummary } from '@/lib/apiClient';
import { useCurrency } from '@/lib/useCurrency';
import { getLocalDateString } from '@/lib/currency';
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
  if (!value) return getLocalDateString();
  return value;
};

export default function DailyReportsPage() {
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userRole, setUserRole] = useState('owner');
  const [expenseForm, setExpenseForm] = useState({
    id: null,
    description: '',
    category: 'Operations',
    amount: '',
    date: parseDate(getLocalDateString()),
  });
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { symbol, currency } = useCurrency();
  const isSalesRep = userRole === 'sales_rep';

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [daySummary, setDaySummary] = useState(null);
  const [isDayLoading, setIsDayLoading] = useState(true);
  const [dayError, setDayError] = useState('');
  const [manualAdjustmentInput, setManualAdjustmentInput] = useState('0');
  const [notesInput, setNotesInput] = useState('');
  const [isSavingDay, setIsSavingDay] = useState(false);

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
        const [allProducts, allExpenses] = await Promise.all([
          fetchProducts(),
          fetchExpenses(),
        ]);

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

  const loadDaySummary = async (date) => {
    setIsDayLoading(true);
    setDayError('');
    try {
      const summary = await fetchDailySummary(date);
      setDaySummary(summary);
      setManualAdjustmentInput(String(summary.manualAdjustment ?? 0));
      setNotesInput(summary.notes || '');
    } catch (error) {
      setDayError(error.message || 'Could not load that day\'s report.');
    } finally {
      setIsDayLoading(false);
    }
  };

  useEffect(() => {
    loadDaySummary(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
      date: parseDate(getLocalDateString()),
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
      date: expense.date || parseDate(getLocalDateString()),
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

  // Saves the manual adjustment + notes for the selected date. If receipts
  // already cover that date and the person is adding/changing a nonzero
  // manual amount, warn first — sales are recorded exactly once, at the
  // receipt, so a manual figure on top of that is very likely a duplicate.
  const handleSaveDaySummary = async () => {
    const newAmount = Number(manualAdjustmentInput) || 0;
    const hasTransactions = (daySummary?.transactionsTotal || 0) > 0;
    const amountChanged = newAmount !== (daySummary?.manualAdjustment || 0);

    if (hasTransactions && amountChanged && newAmount !== 0) {
      const confirmed = window.confirm(
        "Sales for today already include recorded transactions. Adding this amount manually may cause duplicate sales. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    setIsSavingDay(true);
    setDayError('');
    try {
      const updated = await updateDailySummary(selectedDate, {
        manualAdjustment: newAmount,
        notes: notesInput,
      });
      setDaySummary(updated);
    } catch (error) {
      setDayError(error.message || 'Could not save the report.');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleSubmitDayReport = async () => {
    setIsSavingDay(true);
    setDayError('');
    try {
      const updated = await updateDailySummary(selectedDate, {
        manualAdjustment: Number(manualAdjustmentInput) || 0,
        notes: notesInput,
        submitted: true,
      });
      setDaySummary(updated);
    } catch (error) {
      setDayError(error.message || 'Could not submit the report.');
    } finally {
      setIsSavingDay(false);
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={widgetTitleStyle}>Daily Report</div>
            <input
              style={{ ...inputStyle, maxWidth: '200px' }}
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Sales are recorded once, at the receipt — this page just summarizes them for the day.
          </p>

          {dayError && (
            <div style={{ padding: '10px 14px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px' }}>
              {dayError}
            </div>
          )}

          {isDayLoading ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading day report...</div>
          ) : daySummary && (
            <>
              {daySummary.submitted && (
                <div style={{ padding: '8px 12px', background: 'rgba(40,167,69,0.1)', border: '1px solid #28a745', borderRadius: '8px', color: '#3fbf60', fontSize: '12px' }}>
                  Submitted{daySummary.submittedByRole ? ` by ${daySummary.submittedByRole}` : ''}
                  {daySummary.submittedAt ? ` on ${new Date(daySummary.submittedAt).toLocaleString()}` : ''}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>SALES FROM TRANSACTIONS</div>
                  <div style={kpiValueStyle}>{daySummary.transactionsTotalFormatted}</div>
                </div>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>MANUAL ADJUSTMENTS</div>
                  <div style={kpiValueStyle}>{daySummary.manualAdjustmentFormatted}</div>
                </div>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>TOTAL DAILY SALES</div>
                  <div style={kpiValueStyle}>{daySummary.totalSalesFormatted}</div>
                </div>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>EXPENSES (THIS DAY)</div>
                  <div style={kpiValueStyle}>{daySummary.expensesTotalFormatted}</div>
                </div>
                {!isSalesRep && (
                  <div style={kpiCardStyle}>
                    <div style={kpiLabelStyle}>NET (THIS DAY)</div>
                    <div style={kpiValueStyle}>{daySummary.netFormatted}</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Transactions ({daySummary.transactions.length})
                </div>
                {daySummary.transactions.length > 0 ? (
                  <div className="table-scroll">
                  <table style={expenseTableStyle}>
                    <thead style={tableHeadRowStyle}>
                      <tr>
                        <th style={tableHeadCellStyle}>Sale ID</th>
                        <th style={tableHeadCellStyle}>Customer</th>
                        <th style={tableHeadCellStyle}>Items</th>
                        <th style={tableHeadCellStyle}>Total</th>
                        <th style={tableHeadCellStyle}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySummary.transactions.map((t) => (
                        <tr key={t.id}>
                          <td style={{ ...tableBodyCellStyle, fontFamily: 'monospace', fontSize: '11px' }}>{t.id.slice(0, 8)}</td>
                          <td style={tableBodyCellStyle}>{t.customerName}</td>
                          <td style={tableBodyCellStyle}>{t.itemCount}</td>
                          <td style={tableBodyCellStyle}>{symbol}{t.totalAmount}</td>
                          <td style={tableBodyCellStyle}>{new Date(t.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No receipts generated for this date yet.</div>
                )}
              </div>

              <div style={formGridStyle}>
                <label style={formFieldStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manual Adjustment ({symbol})</span>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    value={manualAdjustmentInput}
                    onChange={(event) => setManualAdjustmentInput(event.target.value)}
                  />
                </label>
                <label style={{ ...formFieldStyle, gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes</span>
                  <textarea
                    style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                    value={notesInput}
                    onChange={(event) => setNotesInput(event.target.value)}
                    placeholder="Anything worth noting about today..."
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" style={actionButtonStyle} onClick={handleSaveDaySummary} disabled={isSavingDay}>
                  {isSavingDay ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  style={{ ...actionButtonStyle, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={handleSubmitDayReport}
                  disabled={isSavingDay}
                >
                  {daySummary.submitted ? 'Re-submit Report' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

              <div className="table-scroll">
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