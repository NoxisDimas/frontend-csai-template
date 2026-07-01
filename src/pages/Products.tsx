import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { RefreshCcw, Package, ExternalLink, CheckCircle2, Clock, Eye, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { NotificationToast, NotificationModal } from '../components/Notifications';

interface Product {
  id: string;
  title: string;
  handle: string;
  product_type: string;
  vendor: string;
  tags: string;
  image_url: string;
  embedding_status: string;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState<string>('');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
      NotificationToast.error('Load Failed', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    api.get('/config/system')
      .then(res => {
        if (res.data?.data?.shopify_domain) {
          setShopifyDomain(res.data.data.shopify_domain);
        }
      })
      .catch(err => console.error('Failed to fetch config for domain', err));
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await api.post('/products/sync');
      NotificationToast.success('Sync Started', 'Product synchronization triggered successfully');
      // Refetch after a short delay to show updated statuses
      setTimeout(fetchProducts, 2000);
    } catch (error) {
      console.error('Failed to sync products', error);
      NotificationToast.error('Sync Failed', 'Failed to synchronize products');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${encodeURIComponent(productToDelete.id)}`);
      NotificationToast.success('Product Deleted', 'The product and its embeddings have been removed');
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
      NotificationToast.error('Delete Failed', 'Failed to delete the product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Products (RAG)</h1>
          <p className="text-text-secondary mt-1">Manage synchronized Shopify products and their AI embedding status.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="gap-2">
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Shopify Store'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Synced Catalog</CardTitle>
          <CardDescription>Products available in the AI's knowledge context.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <RefreshCcw className="w-8 h-8 animate-spin text-text-secondary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border-subtle rounded-xl bg-card-elevated/50">
              <Package className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">No products found</h3>
              <p className="text-text-secondary mt-2">Click "Sync Shopify Store" to import your catalog.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-text-secondary uppercase bg-card-elevated/50 border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Product</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle " >
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-card-elevated/30 transition-colors " >
                      <td className="px-4 py-3 ">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-card-elevated border border-border-subtle shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-text-secondary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{product.title}</p>
                            <p className="text-xs text-text-secondary">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{product.product_type || '-'}</td>
                      <td className="px-4 py-3 text-text-secondary">{product.vendor || '-'}</td>
                      <td className="px-4 py-3">
                        {product.embedding_status === 'completed' ? (
                          <Badge variant="success" className="gap-1.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1.5 py-0.5 text-brand-400 bg-brand-500/10 border-brand-500/20">
                            <Clock className="w-3 h-3" /> {product.embedding_status}
                          </Badge>
                        )}
                      </td>
                        <div className="flex justify-end gap-2 items-center px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="View Details"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="w-4 h-4 text-brand-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="View on Store"
                            onClick={() => {
                              if (shopifyDomain && product.handle) {
                                const domain = shopifyDomain.startsWith('http') ? shopifyDomain : `https://${shopifyDomain}`;
                                window.open(`${domain}/products/${product.handle}`, '_blank', 'noopener,noreferrer');
                              } else {
                                NotificationToast.error('Launch Failed', 'Store domain or product handle missing');
                              }
                            }}
                          >
                            <ExternalLink className="w-4 h-4 text-text-secondary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:text-danger hover:bg-danger/10" 
                            title="Delete Product"
                            onClick={() => setProductToDelete(product)}
                          >
                            <Trash2 className="w-4 h-4 text-text-secondary" />
                          </Button>
                        </div>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <NotificationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        type="danger"
        title="Delete Product"
        description={`Are you sure you want to delete ${productToDelete?.title}? This will also remove all its knowledge embeddings.`}
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={() => setProductToDelete(null)}>Cancel</Button>
            <Button 
              className="bg-danger hover:bg-danger/90 text-white" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </div>
        }
      />

      {/* View Details Modal */}
      <NotificationModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        type="default"
        title="Product Details"
        footer={
          <div className="flex justify-end w-full">
            <Button onClick={() => setSelectedProduct(null)}>Close</Button>
          </div>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            {selectedProduct.image_url && (
              <div className="w-full h-48 bg-card-base rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center">
                <img src={selectedProduct.image_url} alt={selectedProduct.title} className="max-h-full object-contain" />
              </div>
            )}
            <div>
              <p className="text-xs text-text-secondary mb-1">Title</p>
              <p className="text-white font-medium">{selectedProduct.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-secondary mb-1">Product ID</p>
                <p className="text-white font-mono text-sm break-all">{selectedProduct.id}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Type</p>
                <p className="text-white">{selectedProduct.product_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Vendor</p>
                <p className="text-white">{selectedProduct.vendor || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Tags</p>
                <p className="text-white">{selectedProduct.tags || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Status Embeddings</p>
              <Badge variant={selectedProduct.embedding_status === 'completed' ? 'success' : 'secondary'} className={selectedProduct.embedding_status !== 'completed' ? 'text-brand-400 bg-brand-500/10' : ''}>
                {selectedProduct.embedding_status}
              </Badge>
            </div>
          </div>
        )}
      </NotificationModal>
    </div>
  );
}
