import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, UserPlus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { NotificationToast, NotificationModal } from '../components/Notifications';

export function UserManagement() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      NotificationToast.error('Load Failed', 'Failed to load users list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditForm = (userToEdit: any) => {
    setEditingUserId(userToEdit.id);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '',
      role: userToEdit.role || 'staff'
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'staff' });
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingUserId) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editingUserId}`, payload);
        NotificationToast.success('User Updated', 'User profile updated successfully');
      } else {
        await api.post('/auth/register', formData);
        NotificationToast.success('User Created', 'New user added successfully');
      }
      handleCancel();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user', error);
      const msg = error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || 'Failed to save user';
      NotificationToast.error('Save Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (userObj: any) => {
    setUserToDelete(userObj);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/auth/users/${userToDelete.id}`);
      NotificationToast.success('User Deleted', 'The user account has been removed');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user', error);
      const msg = error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || 'Failed to delete user';
      NotificationToast.error('Delete Failed', msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">User Management</h1>
          <p className="text-text-secondary mt-1">Manage system administrators and staff access.</p>
        </div>
        <Button className="gap-2" onClick={showAddForm ? handleCancel : () => setShowAddForm(true)}>
          {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} 
          {showAddForm ? 'Cancel' : 'Create User'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-brand-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
          <CardHeader>
            <CardTitle>{editingUserId ? 'Edit User' : 'Create New User'}</CardTitle>
            <CardDescription>
              {editingUserId ? 'Modify user details and access role.' : 'Add a new admin or staff member to the system.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Full Name</label>
                  <Input 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Email</label>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUserId}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Role</label>
                  <select 
                    className="w-full h-10 bg-input-background border border-border-subtle rounded-md px-3 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : (editingUserId ? 'Update User' : 'Save User')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="w-full sm:flex-1 sm:max-w-sm">
            <Input 
              icon={<Search className="w-4 h-4" />} 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto w-full">
          <Table className="w-full whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                .filter(u => 
                  (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
                  (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white font-medium shadow-sm">
                        {u.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-sm text-text-secondary">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        u.role === 'admin' ? 'warning' : 'outline'
                      }
                    >
                      {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(u)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-danger hover:text-danger" 
                        onClick={() => handleDeleteClick(u)}
                        disabled={u.id === user?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-text-secondary">
                    {isLoading ? 'Loading users...' : 'No users found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <NotificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        type="danger"
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-danger hover:bg-danger/90 text-white" onClick={confirmDeleteUser}>Delete User</Button>
          </div>
        }
      />
    </div>
  );
}
