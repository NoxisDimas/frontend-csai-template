import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { UploadCloud, FileText, File, Link as LinkIcon, Database, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { NotificationToast, NotificationModal } from '../components/Notifications';

interface KBDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  pages: number;
}

export function KnowledgeBase() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isCreatingText, setIsCreatingText] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [textForm, setTextForm] = useState({ title: '', content: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async (pageNumber: number) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/kb/documents?page=${pageNumber}&size=10`);
      setDocuments(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (error) {
      console.error('Failed to fetch documents', error);
      NotificationToast.error('Load Failed', 'Failed to load knowledge base documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(page);
  }, [page]);

  const handleSyncShopify = async () => {
    try {
      setIsSyncing(true);
      await api.post('/kb/sync-shopify-store');
      NotificationToast.success('Sync Started', 'Shopify sync triggered successfully');
      setTimeout(() => fetchDocuments(1), 2000);
      setPage(1);
    } catch (error) {
      console.error('Failed to sync Shopify', error);
      NotificationToast.error('Sync Failed', 'Failed to sync Shopify store');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post('/kb/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      NotificationToast.success('Upload Success', 'Document uploaded successfully');
      setTimeout(() => fetchDocuments(1), 2000);
      setPage(1);
    } catch (error) {
      console.error('Failed to upload document', error);
      NotificationToast.error('Upload Failed', 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCreateTextDoc = async () => {
    if (!textForm.title.trim() || !textForm.content.trim()) {
      NotificationToast.error('Validation Failed', 'Please enter both title and content');
      return;
    }
    
    try {
      setIsCreatingText(true);
      await api.post('/kb/documents', textForm);
      NotificationToast.success('Created', 'Text document created successfully');
      setIsTextModalOpen(false);
      setTextForm({ title: '', content: '' });
      setTimeout(() => fetchDocuments(1), 1000);
      setPage(1);
    } catch (error) {
      console.error('Failed to create document', error);
      NotificationToast.error('Create Failed', 'Failed to create text document');
    } finally {
      setIsCreatingText(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDocToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await api.delete(`/kb/documents/${docToDelete}`);
      NotificationToast.success('Deleted', 'Document deleted successfully');
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
      fetchDocuments(page);
    } catch (error) {
      console.error('Failed to delete document', error);
      NotificationToast.error('Delete Failed', 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Knowledge Base</h1>
          <p className="text-text-secondary mt-1">Manage documents that the AI uses to answer customer questions.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Upload Methods - 30% */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4">
          <Card className="border-brand-500/30 bg-brand-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-2">
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Upload Document</h3>
                <p className="text-sm text-text-secondary mt-1">Drag and drop your files here or click to select.</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".pdf,.csv,.xlsx,.txt"
              />
              <Button className="w-full" onClick={triggerFileInput} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Select Files'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-elevated border border-transparent hover:border-border-subtle transition-colors text-left group"
                onClick={() => setIsTextModalOpen(true)}
              >
                <div className="w-10 h-10 rounded-lg bg-card-elevated flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                  <FileText className="w-5 h-5 text-text-secondary group-hover:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Text Input</p>
                  <p className="text-xs text-text-secondary">Paste text directly</p>
                </div>
              </button>

              <button 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card-elevated border border-transparent hover:border-border-subtle transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSyncShopify}
                disabled={isSyncing}
              >
                <div className="w-10 h-10 rounded-lg bg-card-elevated flex items-center justify-center group-hover:bg-[#95BF47]/20 group-hover:text-[#95BF47] transition-colors">
                  {isSyncing ? <Loader2 className="w-5 h-5 text-[#95BF47] animate-spin" /> : <Database className="w-5 h-5 text-text-secondary group-hover:text-[#95BF47]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Shopify Sync</p>
                  <p className="text-xs text-text-secondary">{isSyncing ? 'Syncing...' : 'Import pages & policies'}</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Document Table - 70% */}
        <Card className="flex-1 flex flex-col h-full min-h-[600px]">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div className="w-full sm:flex-1 sm:max-w-sm">
              <Input 
                icon={<Search className="w-4 h-4" />} 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="flex-1 overflow-x-auto w-full">
            <Table className="w-full whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Document Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-text-secondary">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.type.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-text-secondary">
                      No matching documents found.
                    </TableCell>
                  </TableRow>
                ) : documents
                    .filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.type.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-white flex items-center gap-3">
                      <File className="w-4 h-4 text-brand-400" />
                      {doc.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          doc.status === 'embedded' ? 'success' : 
                          doc.status === 'processing' ? 'warning' : 'danger'
                        }
                      >
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => NotificationToast.info('Edit not implemented yet', 'This feature is coming soon.')}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-danger hover:text-danger" onClick={() => handleDeleteClick(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {meta && meta.pages > 1 && (
            <div className="p-4 border-t border-border-subtle flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing page {meta.page} of {meta.pages} ({meta.total} total)
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={page >= meta.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Text Input Modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background-base/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl shadow-2xl border-border-subtle bg-card-base">
            <CardHeader className="border-b border-border-subtle pb-4">
              <CardTitle>Create Text Document</CardTitle>
              <CardDescription>Manually input text content to be added to the knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Document Title</label>
                <Input 
                  placeholder="e.g. Return Policy 2024" 
                  value={textForm.title}
                  onChange={(e) => setTextForm({...textForm, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Content</label>
                <textarea 
                  className="w-full h-48 bg-input-background border border-border-subtle rounded-md p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                  placeholder="Paste your text content here..."
                  value={textForm.content}
                  onChange={(e) => setTextForm({...textForm, content: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button variant="ghost" onClick={() => setIsTextModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTextDoc} disabled={isCreatingText} className="gap-2">
                  {isCreatingText && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreatingText ? 'Saving...' : 'Save Document'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <NotificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        type="danger"
        title="Delete Document"
        description="Are you sure you want to delete this document? The AI will no longer use it for context."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-danger hover:bg-danger/90 text-white" onClick={confirmDelete}>Delete Document</Button>
          </div>
        }
      />
    </div>
  );
}
