import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const products = await getProducts();
      setProducts(products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      stock: product.stock.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      stock: ''
    });
    setEditingProduct(null);
    setShowModal(false);
  };


  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'in-stock') return matchesSearch && product.stock > 10;
    if (filterStatus === 'low-stock') return matchesSearch && product.stock > 0 && product.stock <= 10;
    if (filterStatus === 'out-of-stock') return matchesSearch && product.stock === 0;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #4f46e5',
            borderTop: '4px solid #4338ca',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>Products Management</h1>
            <p style={{ color: '#64748b' }}>Manage your product inventory and pricing</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            style={{
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={20} />
            <span style={{ fontSize: '1rem' }}>Add Product</span>
          </motion.button>
        </div>

        {/* Search and Filter */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white'
            }}>
              <Search size={18} style={{ color: '#6b7280' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '1rem',
                  color: '#1e293b',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => setFilterStatus('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  ...(filterStatus === 'all' ? {
                    background: '#4f46e5',
                    color: 'white'
                  } : {
                    background: '#e2e8f0',
                    color: '#475569'
                  })
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('in-stock')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  ...(filterStatus === 'in-stock' ? {
                    background: '#10b981',
                    color: 'white'
                  } : {
                    background: '#e2e8f0',
                    color: '#475569'
                  })
                }}
              >
                In Stock
              </button>
              <button
                onClick={() => setFilterStatus('low-stock')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  ...(filterStatus === 'low-stock' ? {
                    background: '#f59e0b',
                    color: 'white'
                  } : {
                    background: '#e2e8f0',
                    color: '#475569'
                  })
                }}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilterStatus('out-of-stock')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  ...(filterStatus === 'out-of-stock' ? {
                    background: '#dc2626',
                    color: 'white'
                  } : {
                    background: '#e2e8f0',
                    color: '#475569'
                  })
                }}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-12 text-center border border-slate-200"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No products found</h3>
                <p className="text-slate-500 mb-6">
                  {(searchQuery && searchQuery.length > 0) || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Add your first product to get started'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Add Your First Product
                </motion.button>
              </motion.div>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s ease'
                }}
                whileHover={{ 
                  y: -5, 
                  boxShadow: '0 20px 25px -12px rgba(0, 0, 0, 0.15)' 
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>{product.name}</h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{product.description}</p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        ...(product.stock > 10 ? { color: '#10b981' } : 
                         product.stock > 0 && product.stock <= 10 ? { color: '#f59e0b' } : 
                         product.stock === 0 ? { color: '#dc2626' } : 
                         { color: '#059669' })
                      }}>
                        {product.stock > 10 ? 'In Stock' : 
                         product.stock > 0 && product.stock <= 10 ? 'Low Stock' : 
                         product.stock === 0 ? 'Out of Stock' : 'In Stock'}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#64748b'
                      }}>
                        • {product.stock} units in stock
                      </span>
                    </div>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(product)}
                      style={{
                        color: '#4f46e5',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.25rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(product.id)}
                      style={{
                        color: '#dc2626',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.25rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                padding: '1rem'
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                  padding: '1.5rem',
                  width: '100%',
                  maxWidth: '32rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(false)}
                    style={{
                      color: '#94a3b8',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    <X size={24} />
                  </motion.button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#334155',
                      marginBottom: '0.5rem'
                    }}>Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '1rem',
                        color: '#1e293b',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#334155',
                      marginBottom: '0.5rem'
                    }}>Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '1rem',
                        color: '#1e293b',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#334155',
                      marginBottom: '0.5rem'
                    }}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '1rem',
                        color: '#1e293b',
                        outline: 'none',
                        resize: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#334155',
                      marginBottom: '0.5rem'
                    }}>Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        fontSize: '1rem',
                        color: '#1e293b',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      fontWeight: '500',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetForm}
                    style={{
                      flex: 1,
                      background: '#e2e8f0',
                      color: '#64748b',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </motion.button>
                </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Products;
