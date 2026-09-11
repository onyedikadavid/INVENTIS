'use client';

import { useState, useEffect } from 'react';
import { findProductByName, getStockStatus, computeProfitLabel } from '@/lib/storage';
import { fetchProducts, createProduct, updateProduct, createReceipt, api } from '@/lib/apiClient';
import { normalizeRole } from '@/lib/roles';
import { useCurrency } from '@/lib/useCurrency';
import ProtectedRoute from '@/components/ProtectedRoute';

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyle = {
  fontSize: '24px',
  color: 'var(--text-primary)',
  fontWeight: 700,
};

const filterButtonsStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const filterButtonStyle = {
  padding: '10px 16px',
  background: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const filterButtonActiveStyle = {
  ...filterButtonStyle,
  background: 'var(--primary-gold)',
  color: 'var(--dark-bg)',
  borderColor: 'var(--primary-gold)',
};

const formContainerStyle = {
  background: 'var(--card-bg)',
  border: '2px solid var(--primary-gold)',
  borderRadius: '8px',
  padding: '24px',
};

const formTitleStyle = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontWeight: 700,
  marginBottom: '20px',
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '20px',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const formLabelStyle = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontWeight: 600,
};

const formInputStyle = {
  padding: '10px 12px',
  background: 'var(--primary-dark)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  fontSize: '14px',
  transition: 'all 0.3s ease',
};

const itemInputStyle = {
  ...formInputStyle,
  padding: '8px',
  fontSize: '13px',
  width: '100%',
};

const itemsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '20px',
  maxHeight: '250px',
  overflowY: 'auto',
};

const itemRowStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr 120px 90px 120px',
  gap: '12px',
  padding: '12px',
  background: 'var(--primary-dark)',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  alignItems: 'center',
};

const totalStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '24px',
  padding: '16px',
  background: 'var(--primary-dark)',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  marginBottom: '20px',
};

const totalLabelStyle = {
  fontSize: '14px',
  color: 'var(--text-muted)',
  fontWeight: 600,
};

const totalValueStyle = {
  fontSize: '20px',
  color: 'var(--primary-gold)',
  fontWeight: 700,
  minWidth: '120px',
  textAlign: 'right',
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const addButtonStyle = {
  padding: '10px 16px',
  background: 'var(--primary-dark)',
  color: 'var(--primary-gold)',
  border: '1px solid var(--primary-gold)',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const removeButtonStyle = {
  padding: '4px 8px',
  background: 'transparent',
  color: 'var(--status-danger)',
  border: '1px solid var(--status-danger)',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const editButtonStyle = {
  padding: '4px 8px',
  background: 'transparent',
  color: 'var(--primary-gold)',
  border: '1px solid var(--primary-gold)',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const saveButtonStyle = {
  padding: '4px 8px',
  background: 'var(--primary-gold)',
  color: 'var(--dark-bg)',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const cancelButtonStyle = {
  padding: '4px 8px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const generateButtonStyle = {
  padding: '10px 24px',
  background: 'var(--primary-gold)',
  color: 'var(--dark-bg)',
  border: 'none',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const categories = ['All', 'Computing', 'Accessories', 'Electronics', 'Kitchen', 'Gas'];
const salesRepAllowedCategories = ['Computing', 'Accessories', 'Electronics'];

export default function EReceiptPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userRole, setUserRole] = useState('owner');
  const { symbol, currency } = useCurrency();
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [items, setItems] = useState([]);
  const [newItems, setNewItems] = useState([{ id: Date.now(), qty: '', description: '', category: '', amount: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemData, setEditingItemData] = useState({ qty: '', description: '', category: '', unitAmount: '' });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const role = normalizeRole(parsed.role) || parsed.role;
        setUserRole(role);
        // Sales reps can only bill from a limited set of categories.
        if (role === 'sales_rep') {
          setSelectedCategory(salesRepAllowedCategories[0]);
        }
      }
    } catch (e) {
      console.error('Could not load user role context', e);
    }
  }, []);

  const isSalesRep = userRole === 'sales_rep';
  const availableCategories = isSalesRep
    ? salesRepAllowedCategories
    : categories.filter((c) => c !== 'All');
  const visibleCategories = isSalesRep ? salesRepAllowedCategories : categories;

  // Applies a generated receipt's line items back onto the shared stock list
  // (the same /api/products data everyone else reads): matched items get
  // their inStock reduced and stockSold increased; unmatched item names
  // prompt to add them as new stock, exactly like the Stock Control page does.
  const syncItemsToStock = async (receiptItems) => {
    let allProducts = await fetchProducts();

    for (const item of receiptItems) {
      const existing = findProductByName(allProducts, item.description);

      if (existing) {
        const newInStock = Math.max(0, (Number(existing.inStock) || 0) - item.qty);
        const newStockSold = (Number(existing.stockSold) || 0) + item.qty;
        const updated = await updateProduct(existing.id, {
          inStock: newInStock,
          stockSold: newStockSold,
          status: getStockStatus(newInStock),
          profit: computeProfitLabel(existing.buyPrice, existing.sellPrice, newStockSold, currency),
        });
        allProducts = allProducts.map((p) => (p.id === existing.id ? updated : p));
      } else {
        const shouldAdd = window.confirm(
          `"${item.description}" isn't in your stock list yet. Add it as a new product?`
        );
        if (!shouldAdd) continue;

        const sellPrice = `${symbol}${item.unitAmount.toLocaleString()}`;
        const created = await createProduct({
          name: item.description,
          category: item.category,
          buyPrice: `${symbol}0`,
          sellPrice,
          inStock: 0, // the whole quantity was already sold in this receipt
          stockSold: item.qty,
          profit: computeProfitLabel(`${symbol}0`, sellPrice, item.qty, currency),
          status: getStockStatus(0),
        });
        allProducts = [...allProducts, created];
      }
    }
  };

  const handleAddItemField = () => {
    setNewItems([...newItems, { id: Date.now(), qty: '', description: '', category: '', amount: '' }]);
  };

  const handleUpdateItemField = (id, field, value) => {
    setNewItems(newItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItemField = (id) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter(item => item.id !== id));
    }
  };

  const handleAddItem = (newItem) => {
    if (newItem.qty && newItem.description && newItem.category && newItem.amount) {
      if (isSalesRep && !salesRepAllowedCategories.includes(newItem.category)) {
        alert('Sales reps can only bill: ' + salesRepAllowedCategories.join(', '));
        return false;
      }
      const item = {
        id: Date.now() + Math.random(),
        qty: parseInt(newItem.qty),
        description: newItem.description,
        category: newItem.category,
        unitAmount: parseFloat(newItem.amount),
        total: parseInt(newItem.qty) * parseFloat(newItem.amount),
      };
      setItems(prevItems => [...prevItems, item]);
      return true;
    }
    return false;
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  const startEditingItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemData({
      qty: String(item.qty),
      description: item.description,
      category: item.category,
      unitAmount: String(item.unitAmount),
    });
  };

  const handleSaveEditedItem = (id) => {
    if (editingItemData.qty && editingItemData.description && editingItemData.category && editingItemData.unitAmount) {
      const updatedQty = parseInt(editingItemData.qty) || 0;
      const updatedAmount = parseFloat(editingItemData.unitAmount) || 0;

      setItems(items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            qty: updatedQty,
            description: editingItemData.description,
            category: editingItemData.category,
            unitAmount: updatedAmount,
            total: updatedQty * updatedAmount,
          };
        }
        return item;
      }));
      setEditingItemId(null);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  };

  const handleGenerateReceipt = async () => {
    if (customerName && customerWhatsApp && items.length > 0) {
      setIsSubmitting(true);
      try {
        const totalAmount = calculateTotal();

        const receipt = await createReceipt({
          customerName,
          customerPhone: customerWhatsApp,
          items,
          totalAmount,
        });
        const transactionId = receipt?.id ? receipt.id.slice(0, 8) : null;
        const transactionLine = transactionId ? `\nTransaction ID: ${transactionId}` : '';

        await syncItemsToStock(items);

        let whatsappResult = null;
        try {
          whatsappResult = await api.post('/api/whatsapp/send-receipt', {
            phoneNumber: customerWhatsApp,
            customerName,
            items,
            total: parseFloat(totalAmount),
          });
        } catch (whatsappError) {
          console.error('WhatsApp send failed:', whatsappError);
        }

        if (whatsappResult?.sent) {
          alert(`E-Receipt generated and sent to WhatsApp successfully!${transactionLine}`);
        } else if (whatsappResult?.whatsappLink) {
          // No WhatsApp Business API configured — open a pre-filled chat so
          // the receipt just needs one tap to send from your own WhatsApp.
          window.open(whatsappResult.whatsappLink, '_blank', 'noopener,noreferrer');
          alert(`E-Receipt generated. Opening WhatsApp so you can send it — just hit send in the chat that opened.${transactionLine}`);
        } else {
          alert(`E-Receipt generated, but WhatsApp could not be opened. You can share it manually.${transactionLine}`);
        }

        setCustomerName('');
        setCustomerWhatsApp('');
        setItems([]);
        setNewItems([{ id: Date.now(), qty: '', description: '', category: '', amount: '' }]);
        setEditingItemId(null);
      } catch (error) {
        alert(error.message || 'Could not generate the receipt. Please try again.');
        console.error('Error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ProtectedRoute>
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>E-Receipt</h1>
        </div>

        {/* Category Filter */}
        <div style={filterButtonsStyle}>
          {visibleCategories.map((category) => (
            <button
              key={category}
              style={selectedCategory === category ? filterButtonActiveStyle : filterButtonStyle}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* E-Receipt Form */}
        <div style={formContainerStyle}>
          <div style={formTitleStyle}>Create E-Receipt</div>

          {/* Customer Details */}
          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Customer Name</label>
              <input
                style={formInputStyle}
                type="text"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Customer WhatsApp Number</label>
              <input
                style={formInputStyle}
                type="tel"
                placeholder="Enter WhatsApp number"
                value={customerWhatsApp}
                onChange={(e) => setCustomerWhatsApp(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 1: ADDED ITEMS PREVIEW DISPLAY (MOVED ABOVE INPUTS) */}
          {items.length > 0 && (
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px dashed var(--border-color)' }}>
              <div style={{ ...formLabelStyle, marginBottom: '10px', color: 'var(--primary-gold)' }}>
                Added Items List ({items.length})
              </div>
              <div style={itemsContainerStyle}>
                {items.map((item) => (
                  <div key={item.id} style={itemRowStyle}>
                    {editingItemId === item.id ? (
                      <>
                        <input
                          type="number"
                          style={itemInputStyle}
                          value={editingItemData.qty}
                          onChange={(e) => setEditingItemData({ ...editingItemData, qty: e.target.value })}
                        />
                        <input
                          type="text"
                          style={itemInputStyle}
                          value={editingItemData.description}
                          onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                        />
                        <select
                          style={itemInputStyle}
                          value={editingItemData.category}
                          onChange={(e) => setEditingItemData({ ...editingItemData, category: e.target.value })}
                        >
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          style={itemInputStyle}
                          value={editingItemData.unitAmount}
                          onChange={(e) => setEditingItemData({ ...editingItemData, unitAmount: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={saveButtonStyle} onClick={() => handleSaveEditedItem(item.id)}>Save</button>
                          <button style={cancelButtonStyle} onClick={() => setEditingItemId(null)}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                          {item.qty}x
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                            {item.description}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {item.category} • {symbol}{item.unitAmount}
                          </div>
                        </div>
                        <div style={{ color: 'var(--primary-gold)', fontSize: '13px', fontWeight: 700 }}>
                          {symbol}{item.total.toFixed(2)}
                        </div>
                        <div>
                          <button style={editButtonStyle} onClick={() => startEditingItem(item)}>Edit</button>
                        </div>
                        <div>
                          <button style={removeButtonStyle} onClick={() => handleRemoveItem(item.id)}>Remove</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: NEW ITEM DATA ENTRY FIELDS */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ ...formLabelStyle, marginBottom: '10px' }}>Add New Items Below</div>
            
            <div style={{ ...itemsContainerStyle, maxHeight: '400px', marginBottom: '20px' }}>
              {newItems.map((newItem) => (
                <div key={newItem.id} style={{
                  padding: '16px',
                  background: 'var(--primary-dark)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px 80px 60px',
                  gap: '12px',
                  alignItems: 'center',
                }}>
                  <div style={formGroupStyle}>
                    <label style={{ ...formLabelStyle, fontSize: '10px' }}>Qty</label>
                    <input
                      style={itemInputStyle}
                      type="number"
                      placeholder="Qty"
                      value={newItem.qty}
                      onChange={(e) => handleUpdateItemField(newItem.id, 'qty', e.target.value)}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={{ ...formLabelStyle, fontSize: '10px' }}>Item Description</label>
                    <input
                      style={itemInputStyle}
                      type="text"
                      placeholder="Item description"
                      value={newItem.description}
                      onChange={(e) => handleUpdateItemField(newItem.id, 'description', e.target.value)}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={{ ...formLabelStyle, fontSize: '10px' }}>Category</label>
                    <select
                      style={itemInputStyle}
                      value={newItem.category}
                      onChange={(e) => handleUpdateItemField(newItem.id, 'category', e.target.value)}
                    >
                      <option value="">Select</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div style={formGroupStyle}>
                    <label style={{ ...formLabelStyle, fontSize: '10px' }}>Amount</label>
                    <input
                      style={itemInputStyle}
                      type="number"
                      placeholder="Amount"
                      value={newItem.amount}
                      onChange={(e) => handleUpdateItemField(newItem.id, 'amount', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      style={{...removeButtonStyle, padding: '4px 6px', fontSize: '11px'}}
                      onClick={() => handleRemoveItemField(newItem.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{...addButtonStyle, flex: 1}}
                onClick={handleAddItemField}
              >
                + Add New Field
              </button>
              <button
                style={{
                  ...addButtonStyle,
                  background: 'var(--primary-gold)',
                  color: 'var(--dark-bg)',
                  border: 'none',
                  flex: 1
                }}
                onClick={() => {
                  newItems.forEach(newItem => {
                    handleAddItem(newItem);
                  });
                  setNewItems([{ id: Date.now(), qty: '', description: '', category: '', amount: '' }]);
                }}
              >
                ✓ Add All Items
              </button>
            </div>
          </div>

          {/* Total and Action Buttons */}
          {items.length > 0 && (
            <div style={totalStyle}>
              <span style={totalLabelStyle}>Receipt Total</span>
              <span style={totalValueStyle}>{symbol}{calculateTotal()}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={buttonGroupStyle}>
            <button
              style={generateButtonStyle}
              onClick={handleGenerateReceipt}
              disabled={!customerName || !customerWhatsApp || items.length === 0 || editingItemId !== null}
            >
              Generate Receipt
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}