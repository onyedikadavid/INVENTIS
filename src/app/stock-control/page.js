'use client';

import { useState, useEffect } from 'react';
import { findProductByName, getStockStatus, computeProfitLabel } from '@/lib/storage';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/apiClient';
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

const addButtonStyle = {
  padding: '12px 24px',
  background: 'var(--primary-gold)',
  color: 'var(--dark-bg)',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
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

const tableContainerStyle = {
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

const formContainerStyle = {
  background: 'var(--card-bg)',
  border: '2px solid var(--primary-gold)',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '12px',
};

const formTitleStyle = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontWeight: 700,
  marginBottom: '20px',
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  gap: '16px',
  marginBottom: '20px',
};

// Layout adjustments when Unit Price field is hidden for reps
const salesFormGridStyle = {
  ...formGridStyle,
  gridTemplateColumns: '2fr 1fr 1fr',
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

const formButtonsStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const submitButtonStyle = {
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

const cancelButtonStyle = {
  padding: '10px 24px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' };
const modalContentStyle = { background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '28px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '90vh', overflowY: 'auto' };
const editActionButtonStyle = { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' };
const deleteActionButtonStyle = { background: 'transparent', border: '1px solid #d75959', color: '#f29c9c', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' };

const categories = ['All', 'Computing', 'Accessories', 'Electronics', 'Kitchen', 'Gas'];

const getQuantityStatus = (quantity) => {
  if (quantity >= 100) return 'high';
  if (quantity >= 50) return 'medium';
  return 'low';
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

export default function StockControlPage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState('sales_rep'); // Fallback default role
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { symbol, currency } = useCurrency();
  const [formData, setFormData] = useState({
    product: '',
    category: '',
    quantity: '',
    unitPrice: '',
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', buyPrice: '', sellPrice: '', inStock: '', stockSold: '' });
  const [isEditSaving, setIsEditSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoadError('');
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      setLoadError(error.message || 'Could not load stock from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // This is the single, shared stock record: it's the same Postgres-backed
    // /api/products data that Products, Dashboard, and Daily Reports read
    // from — so adding stock here shows up everywhere else, for every
    // device/browser, immediately.
    loadProducts();

    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role) setUserRole(normalizeRole(parsed.role) || parsed.role);
      }
    } catch (e) {
      console.error('Could not load user role context', e);
    }
  }, []);

  const isOwner = userRole === 'owner';

  const filteredItems = selectedCategory === 'All'
    ? products
    : products.filter((item) => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleAddClick = () => {
    setShowForm(!showForm);
    if (showForm) {
      setFormData({ product: '', category: '', quantity: '', unitPrice: '' });
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const quantity = parseInt(formData.quantity, 10) || 0;
    const finalUnitPrice = isOwner ? (parseFloat(formData.unitPrice) || 0) : 0;

    if (!formData.product || !formData.category || !quantity || (isOwner && !formData.unitPrice)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const existing = findProductByName(products, formData.product);

      if (existing) {
        // Product is already in the stock list — just add to what's there.
        const newInStock = (Number(existing.inStock) || 0) + quantity;
        const updated = await updateProduct(existing.id, {
          inStock: newInStock,
          status: getStockStatus(newInStock),
          profit: computeProfitLabel(existing.buyPrice, existing.sellPrice, existing.stockSold, currency),
        });
        setProducts((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
      } else {
        // Brand-new product name — ask before creating it, per "add it or leave it".
        const shouldAdd = window.confirm(
          `"${formData.product}" isn't in your stock list yet. Add it as a new product?`
        );
        if (!shouldAdd) {
          setFormData({ product: '', category: '', quantity: '', unitPrice: '' });
          setShowForm(false);
          setIsSubmitting(false);
          return;
        }

        const sellPrice = isOwner ? `${symbol}${finalUnitPrice.toLocaleString()}` : `${symbol}0`;
        const newProduct = await createProduct({
          name: formData.product,
          category: formData.category,
          buyPrice: `${symbol}0`,
          sellPrice,
          inStock: quantity,
          stockSold: 0,
          profit: computeProfitLabel(`${symbol}0`, sellPrice, 0, currency),
          status: getStockStatus(quantity),
        });
        setProducts((prev) => [...prev, newProduct]);

        if (!isOwner) {
          alert(`"${formData.product}" was added to stock. Ask the owner to confirm its price.`);
        }
      }

      setFormData({ product: '', category: '', quantity: '', unitPrice: '' });
      setShowForm(false);
    } catch (error) {
      alert(error.message || 'Could not save stock changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full CRUD for the Owner: edit any field on an existing product
  // (including cost/selling price), or remove it from stock entirely.
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      buyPrice: String(parseFloat(String(product.buyPrice).replace(/[^0-9.-]/g, '')) || 0),
      sellPrice: String(parseFloat(String(product.sellPrice).replace(/[^0-9.-]/g, '')) || 0),
      inStock: String(product.inStock ?? 0),
      stockSold: String(product.stockSold ?? 0),
    });
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;

    const buyPrice = parseFloat(editForm.buyPrice) || 0;
    const sellPrice = parseFloat(editForm.sellPrice) || 0;
    const inStock = parseInt(editForm.inStock, 10) || 0;
    const stockSold = parseInt(editForm.stockSold, 10) || 0;

    setIsEditSaving(true);
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: editForm.name,
        category: editForm.category,
        buyPrice: `${symbol}${buyPrice.toLocaleString()}`,
        sellPrice: `${symbol}${sellPrice.toLocaleString()}`,
        inStock,
        stockSold,
        status: getStockStatus(inStock),
        profit: computeProfitLabel(`${symbol}${buyPrice}`, `${symbol}${sellPrice}`, stockSold, currency),
      });
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      setEditingProduct(null);
    } catch (error) {
      alert(error.message || 'Could not save product changes.');
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}" from stock? This can't be undone.`)) return;

    const previous = products;
    setProducts((prev) => prev.filter((p) => p.id !== product.id)); // optimistic
    try {
      await deleteProduct(product.id);
    } catch (error) {
      setProducts(previous);
      alert(error.message || 'Could not delete product.');
    }
  };

  return (
    /* Both owner and sales rep can view and add stock here; owners additionally see pricing. */
    <ProtectedRoute requiredRole={['owner', 'sales_rep']}>
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>Stock Control</h1>
          <button
            style={addButtonStyle}
            onClick={handleAddClick}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            + ADD STOCK
          </button>
        </div>

        {loadError && (
          <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.1)', border: '1px solid #dc3545', borderRadius: '8px', color: '#dc3545', fontSize: '13px' }}>
            {loadError}
          </div>
        )}

        {/* Category Filter */}
        <div style={filterButtonsStyle}>
          {categories.map((category) => (
            <button
              key={category}
              style={
                selectedCategory === category
                  ? filterButtonActiveStyle
                  : filterButtonStyle
              }
              onClick={() => setSelectedCategory(category)}
              onMouseEnter={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.borderColor = 'var(--primary-gold)';
                  e.target.style.color = 'var(--primary-gold)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Add Stock Form */}
        {showForm && (
          <div style={formContainerStyle}>
            <div style={formTitleStyle}>Add New Stock Entry</div>
            <div style={isOwner ? formGridStyle : salesFormGridStyle}>
              <div style={formGroupStyle}>
                <label style={formLabelStyle}>Product Name</label>
                <input
                  style={formInputStyle}
                  type="text"
                  placeholder="Enter product name"
                  value={formData.product}
                  onChange={(e) => handleFormChange('product', e.target.value)}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={formLabelStyle}>Category</label>
                <select
                  style={formInputStyle}
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={formLabelStyle}>Quantity</label>
                <input
                  style={formInputStyle}
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                />
              </div>
              {/* Financial input conditionally rendered only for owners */}
              {isOwner && (
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Unit Price ({symbol})</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    placeholder="0"
                    value={formData.unitPrice}
                    onChange={(e) => handleFormChange('unitPrice', e.target.value)}
                  />
                </div>
              )}
            </div>
            <div style={formButtonsStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => {
                  setShowForm(false);
                  setFormData({ product: '', category: '', quantity: '', unitPrice: '' });
                }}
              >
                Cancel
              </button>
              <button
                style={submitButtonStyle}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Add Entry'}
              </button>
            </div>
          </div>
        )}

        {/* Stock Table */}
        <div style={tableContainerStyle}>
          <div style={tableHeaderStyle}>
            <div style={tableTitleStyle}>Stock Inventory</div>
          </div>
          <div className="table-scroll">
          <table style={tableStyle}>
            <thead style={tableHeadRowStyle}>
              <tr>
                <th style={tableHeadCellStyle}>Product</th>
                <th style={tableHeadCellStyle}>Category</th>
                <th style={tableHeadCellStyle}>Qty Remaining</th>
                <th style={tableHeadCellStyle}>Qty Sold</th>
                {isOwner && <th style={tableHeadCellStyle}>Sell Price</th>}
                <th style={tableHeadCellStyle}>Status</th>
                {isOwner && <th style={tableHeadCellStyle}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={tableBodyCellStyle}>{item.name}</td>
                    <td style={tableBodyCellStyle}>{item.category}</td>
                    <td style={tableBodyCellStyle}>{item.inStock}</td>
                    <td style={tableBodyCellStyle}>{item.stockSold || 0}</td>
                    {isOwner && <td style={tableBodyCellStyle}>{item.sellPrice}</td>}
                    <td style={getStatusStyle(item.status)}>
                      {item.status === 'high' ? '● High' : item.status === 'medium' ? '● Medium' : '● Low'}
                    </td>
                    {isOwner && (
                      <td style={tableBodyCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" style={editActionButtonStyle} onClick={() => handleOpenEdit(item)}>
                            Edit
                          </button>
                          <button type="button" style={deleteActionButtonStyle} onClick={() => handleDeleteProduct(item)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isOwner ? 7 : 5} style={{ ...tableBodyCellStyle, textAlign: 'center' }}>
                    {isLoading ? 'Loading stock...' : 'No stock items yet — use "+ ADD STOCK" to record your first item.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {editingProduct && (
          <div style={modalOverlayStyle} onClick={handleCloseEdit}>
            <form style={modalContentStyle} onClick={(e) => e.stopPropagation()} onSubmit={handleSaveEdit}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Edit Product</h3>

              <div style={formGroupStyle}>
                <label style={formLabelStyle}>Product Name</label>
                <input
                  style={formInputStyle}
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={formLabelStyle}>Category</label>
                <select
                  style={formInputStyle}
                  value={editForm.category}
                  onChange={(e) => handleEditFormChange('category', e.target.value)}
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Cost Price ({symbol})</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.buyPrice}
                    onChange={(e) => handleEditFormChange('buyPrice', e.target.value)}
                    required
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Selling Price ({symbol})</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.sellPrice}
                    onChange={(e) => handleEditFormChange('sellPrice', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Qty Remaining</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    min="0"
                    value={editForm.inStock}
                    onChange={(e) => handleEditFormChange('inStock', e.target.value)}
                    required
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Qty Sold (lifetime)</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    min="0"
                    value={editForm.stockSold}
                    onChange={(e) => handleEditFormChange('stockSold', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" style={cancelButtonStyle} onClick={handleCloseEdit}>Cancel</button>
                <button type="submit" style={submitButtonStyle} disabled={isEditSaving}>
                  {isEditSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}