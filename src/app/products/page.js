'use client';

import { useState, useEffect } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/apiClient';
import { useCurrency } from '@/lib/useCurrency';
import ProtectedRoute from '@/components/ProtectedRoute';

// LAYOUT STYLES
const pageStyle = { display: 'flex', flexDirection: 'column', gap: '24px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle = { fontSize: '24px', color: 'var(--text-primary)', fontWeight: 700 };
const addButtonStyle = { padding: '12px 24px', background: 'var(--primary-gold)', color: 'var(--dark-bg)', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' };
const filterButtonsStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap' };
const filterButtonStyle = { padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' };
const filterButtonActiveStyle = { ...filterButtonStyle, background: 'var(--primary-gold)', color: 'var(--dark-bg)', borderColor: 'var(--primary-gold)' };
const tableContainerStyle = { background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' };
const tableHeaderStyle = { padding: '20px 24px', borderBottom: '1px solid var(--border-color)' };
const tableTitleStyle = { fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeadRowStyle = { background: 'var(--primary-dark)', borderBottom: '1px solid var(--border-color)' };
const tableHeadCellStyle = { padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' };
const tableBodyCellStyle = { padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' };
const actionsCellStyle = { padding: '16px 24px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'center' };
const editButtonStyle = { padding: '6px 12px', background: 'var(--primary-gold)', color: 'var(--dark-bg)', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' };
const deleteButtonStyle = { padding: '6px 12px', background: 'var(--status-danger)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' };

const statusHighStyle = { ...tableBodyCellStyle, backgroundColor: 'rgba(0, 204, 0, 0.1)', color: 'var(--status-success)', fontWeight: 600 };
const statusMediumStyle = { ...tableBodyCellStyle, backgroundColor: 'rgba(255, 184, 28, 0.1)', color: 'var(--status-warning)', fontWeight: 600 };
const statusLowStyle = { ...tableBodyCellStyle, backgroundColor: 'rgba(255, 51, 51, 0.1)', color: 'var(--status-danger)', fontWeight: 600 };

// MODAL OVERLAY STYLES
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 };
const inputStyle = { padding: '10px 14px', background: 'var(--primary-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const modalActionsStyle = { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' };
const cancelButtonStyle = { padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' };
const saveButtonStyle = { padding: '10px 18px', background: 'var(--primary-gold)', color: 'var(--dark-bg)', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' };

const categories = ['All', 'Computing', 'Accessories', 'Electronics', 'Kitchen', 'Gas'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'high': return statusHighStyle;
    case 'medium': return statusMediumStyle;
    case 'low': return statusLowStyle;
    default: return tableBodyCellStyle;
  }
};

const getStatusDisplay = (status) => {
  switch (status) {
    case 'high': return '● High';
    case 'medium': return '● Medium';
    case 'low': return '● Low';
    default: return '● Unknown';
  }
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userRole, setUserRole] = useState('owner');
  
  // Financial Summary Cards State
  const [financials, setFinancials] = useState({ totalProfit: 0, totalLoss: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Computing',
    buyPrice: '',
    sellPrice: '',
    inStock: '',
    stockSold: '0',
  });

  // Calculate Totals dynamically whenever products array updates
  useEffect(() => {
    let profitAccumulator = 0;
    let lossAccumulator = 0;

    products.forEach(p => {
      const sold = parseInt(p.stockSold, 10) || 0;
      const buy = parseFloat(String(p.buyPrice).replace(/[^0-9.]/g, '')) || 0;
      const sell = parseFloat(String(p.sellPrice).replace(/[^0-9.]/g, '')) || 0;
      
      const itemNetResult = (sell - buy) * sold;

      if (itemNetResult > 0) {
        profitAccumulator += itemNetResult;
      } else if (itemNetResult < 0) {
        lossAccumulator += Math.abs(itemNetResult); // Keep loss as a positive metric value
      }
    });

    setFinancials({ totalProfit: profitAccumulator, totalLoss: lossAccumulator });
  }, [products]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { symbol, format } = useCurrency();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }

    fetchProducts()
      .then(setProducts)
      .catch((error) => setLoadError(error.message || 'Could not load products from the server.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleEditClick = (product) => {
    setEditingId(product.id);
    
    const rawBuy = String(product.buyPrice || '').replace(/[^0-9.]/g, '');
    const rawSell = String(product.sellPrice || '').replace(/[^0-9.]/g, '');
    
    setFormData({
      name: product.name,
      category: product.category,
      buyPrice: rawBuy,
      sellPrice: rawSell,
      inStock: String(product.inStock),
      stockSold: String(product.stockSold || 0),
    });
    
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (userRole !== 'owner') {
      alert('Only owners can delete products');
      return;
    }
    if (!window.confirm('Delete this product?')) return;

    const previous = products;
    setProducts(products.filter((p) => p.id !== productId)); // optimistic
    try {
      await deleteProduct(productId);
    } catch (error) {
      setProducts(previous); // revert on failure
      alert(error.message || 'Could not delete product.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const stockNum = parseInt(formData.inStock, 10) || 0;
    const soldNum = parseInt(formData.stockSold, 10) || 0;

    let computedStatus = 'low';
    if (stockNum > 50) computedStatus = 'high';
    else if (stockNum >= 15) computedStatus = 'medium';

    const cleanBuyPrice = parseFloat(formData.buyPrice) || 0;
    const cleanSellPrice = parseFloat(formData.sellPrice) || 0;

    // Net difference per single unit item
    const netUnitResult = cleanSellPrice - cleanBuyPrice;
    const formattedNetString = format(netUnitResult * soldNum);

    setIsSaving(true);
    try {
      if (editingId) {
        const updates = {
          name: formData.name,
          category: formData.category,
          sellPrice: `${symbol}${cleanSellPrice.toLocaleString()}`,
          inStock: stockNum,
          stockSold: soldNum,
        };
        if (!isSalesRep) {
          updates.buyPrice = `${symbol}${cleanBuyPrice.toLocaleString()}`;
          updates.profit = formattedNetString;
        }
        updates.status = computedStatus;

        const updated = await updateProduct(editingId, updates);
        setProducts((prev) => prev.map((prod) => (prod.id === editingId ? updated : prod)));
      } else {
        const created = await createProduct({
          name: formData.name,
          category: formData.category,
          buyPrice: `${symbol}${cleanBuyPrice.toLocaleString()}`,
          sellPrice: `${symbol}${cleanSellPrice.toLocaleString()}`,
          inStock: stockNum,
          stockSold: soldNum,
          profit: formattedNetString,
          status: computedStatus,
        });
        setProducts((prev) => [...prev, created]);
      }

      closeModal();
    } catch (error) {
      alert(error.message || 'Could not save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setFormData({ name: '', category: 'Computing', buyPrice: '', sellPrice: '', inStock: '', stockSold: '0' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const isSalesRep = userRole === 'sales_rep';

  return (
    <ProtectedRoute requiredRole={['owner', 'sales_rep']}>
      <div style={pageStyle}>
        
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>Products</h1>
          {userRole === 'owner' && (
            <button
              style={addButtonStyle}
              onClick={() => { setEditingId(null); setIsModalOpen(true); }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              + ADD PRODUCTS
            </button>
          )}
        </div>

        {loadError && (
          <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px' }}>
            {loadError}
          </div>
        )}

        {/* FINANCIAL SUMMARY CARDS DISPLAY BLOCK */}
        {!isSalesRep && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL PROFIT</span>
              <span style={{ fontSize: '24px', color: 'var(--status-success)', fontWeight: 700 }}>${financials.totalProfit.toLocaleString()}</span>
            </div>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL LOSS</span>
              <span style={{ fontSize: '24px', color: 'var(--status-danger)', fontWeight: 700 }}>${financials.totalLoss.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={filterButtonsStyle}>
          {categories.map((category) => (
            <button
              key={category}
              style={selectedCategory === category ? filterButtonActiveStyle : filterButtonStyle}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sales Rep Notice */}
        {isSalesRep && (
          <div style={{ padding: '12px 16px', background: 'rgba(255, 184, 28, 0.1)', border: '1px solid var(--status-warning)', borderRadius: '6px', color: 'var(--status-warning)', fontSize: '12px', fontWeight: 600 }}>
            📌 Sales Rep View: Financial details (Buy price, Profit/Loss) are hidden. You can only update stock levels.
          </div>
        )}

        {/* Products Table */}
        <div style={tableContainerStyle}>
          <div style={tableHeaderStyle}>
            <div style={tableTitleStyle}>Product Inventory</div>
          </div>
          <div className="table-scroll">
          <table style={tableStyle}>
            <thead style={tableHeadRowStyle}>
              <tr>
                <th style={tableHeadCellStyle}>Product</th>
                <th style={tableHeadCellStyle}>Category</th>
                {!isSalesRep && <th style={tableHeadCellStyle}>Buy</th>}
                <th style={tableHeadCellStyle}>Sell</th>
                <th style={tableHeadCellStyle}>Stock</th>
                <th style={tableHeadCellStyle}>Sold</th>
                {!isSalesRep && <th style={tableHeadCellStyle}>Net Return</th>}
                <th style={tableHeadCellStyle}>Status</th>
                <th style={tableHeadCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLoss = String(product.profit).includes('-');
                return (
                  <tr key={product.id}>
                    <td style={tableBodyCellStyle}>{product.name}</td>
                    <td style={tableBodyCellStyle}>{product.category}</td>
                    {!isSalesRep && <td style={tableBodyCellStyle}>{product.buyPrice}</td>}
                    <td style={tableBodyCellStyle}>{product.sellPrice}</td>
                    <td style={tableBodyCellStyle}>{product.inStock}</td>
                    <td style={tableBodyCellStyle}>{product.stockSold}</td>
                    {!isSalesRep && (
                      <td style={{ ...tableBodyCellStyle, color: isLoss ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 600 }}>
                        {product.profit}
                      </td>
                    )}
                    <td style={getStatusStyle(product.status)}>{getStatusDisplay(product.status)}</td>
                    <td style={actionsCellStyle}>
                      <button style={editButtonStyle} onClick={() => handleEditClick(product)}>
                        {isSalesRep ? 'Update Stock' : 'Edit'}
                      </button>
                      {!isSalesRep && (
                        <button style={deleteButtonStyle} onClick={() => handleDelete(product.id)}>
                          DELETE
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM OVERLAY */}
      {isModalOpen && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...titleStyle, fontSize: '18px' }}>
              {editingId ? 'Edit Product Parameters' : 'Add New Product'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Product Name</label>
                <input type="text" required disabled={isSalesRep} style={{...inputStyle, opacity: isSalesRep ? 0.6 : 1}} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Category</label>
                <select disabled={isSalesRep} style={{...selectStyle, opacity: isSalesRep ? 0.6 : 1}} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {!isSalesRep && (
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Buying Price ({symbol})</label>
                  <input type="number" step="0.01" required style={inputStyle} value={formData.buyPrice} onChange={(e) => setFormData({...formData, buyPrice: e.target.value})} />
                </div>
              )}

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Selling Price ({symbol})</label>
                <input type="number" step="0.01" required disabled={isSalesRep} style={{...inputStyle, opacity: isSalesRep ? 0.6 : 1}} value={formData.sellPrice} onChange={(e) => setFormData({...formData, sellPrice: e.target.value})} />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>{isSalesRep ? 'Current Stock Level' : 'Available Stock Volume'}</label>
                <input type="number" required style={inputStyle} value={formData.inStock} onChange={(e) => setFormData({...formData, inStock: e.target.value})} />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Units Sold</label>
                <input type="number" required style={inputStyle} value={formData.stockSold} onChange={(e) => setFormData({...formData, stockSold: e.target.value})} />
              </div>

              <div style={modalActionsStyle}>
                <button type="button" style={cancelButtonStyle} onClick={closeModal}>Cancel</button>
                <button type="submit" style={saveButtonStyle} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingId ? 'Save Updates' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}