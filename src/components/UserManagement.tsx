'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { csrfFetch } from '@/lib/csrf'
import { 
  Search, 
  UserPlus, 
  Download, 
  Mail, 
  Ban, 
  CheckCircle, 
  Users, 
  Building,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import type { 
  UserWithBusinesses, 
  UserManagementStats, 
  UserBulkAction,
  ApiResponse 
} from '@/types'

interface UserManagementProps {
  onClose?: () => void
}

export function UserManagement({ onClose: _onClose }: UserManagementProps) {
  // State management
  const [users, setUsers] = useState<UserWithBusinesses[]>([])
  const [stats, setStats] = useState<UserManagementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Filtering and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Modals
  const [showUserEdit, setShowUserEdit] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithBusinesses | null>(null)

  // Fetch users data
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sort: 'createdAt',
        order: 'desc'
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const result: ApiResponse<{
        users: UserWithBusinesses[]
        pagination: {
          currentPage: number
          totalPages: number
          totalCount: number
          hasNextPage: boolean
          hasPrevPage: boolean
          limit: number
        }
        stats: UserManagementStats
      }> = await response.json()

      if (result.success && result.data) {
        setUsers(result.data.users)
        setStats(result.data.stats)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCount(result.data.pagination.totalCount)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // User actions
  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleEditUser = (user: UserWithBusinesses) => {
    setSelectedUser(user)
    setShowUserEdit(true)
  }

  const handleViewUser = (user: UserWithBusinesses) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleDeleteUser = (user: UserWithBusinesses) => {
    setSelectedUser(user)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await csrfFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchUsers()
        setShowDeleteConfirm(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleBulkAction = (action: UserBulkAction['action']) => {
    if (selectedUsers.length === 0) return
    // TODO: Implement bulk action modal
    console.log('Bulk action:', action, 'for users:', selectedUsers)
  }

  const _executeBulkAction = async (_actionData: UserBulkAction) => {
    // TODO: Implement bulk action execution
    console.log('Execute bulk action')
  }

  // Role badge styling
  const getRoleBadge = (role: string) => {
    const roleStyles = {
      super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-red-100 text-red-800 border-red-200',
      business_owner: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return (
      <Badge variant="outline" className={roleStyles[role as keyof typeof roleStyles] || roleStyles.user}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  // Status badge styling
  const getStatusBadge = (user: UserWithBusinesses) => {
    if (user.isSuspended) {
      return <Badge variant="destructive">Suspended</Badge>
    }
    if (!user.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Business Owners</p>
                <p className="text-2xl font-bold">{stats.businessOwners}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Signups</p>
                <p className="text-2xl font-bold">{stats.recentSignups}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowUserEdit(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="business_owner">Business Owner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-xs"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('suspend')}
                    className="text-xs"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('send_email')}
                    className="text-xs"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Export users')}
                    className="text-xs"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table - Desktop */}
          <div className="hidden lg:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Business Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUserSelect(user.id, e.target.checked)}
                          className="rounded border-gray-300"
                          aria-label={`Select user ${user.firstName} ${user.lastName}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-700 truncate">{user.email}</div>
                            <div className="text-xs text-gray-600">
                              ID: {user.id?.slice(-8) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">{user.totalBusinesses || 0}</span>
                            <span className="text-gray-700"> total</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">{user.claimedBusinesses || 0}</span>
                            <span className="text-gray-700"> claimed</span>
                          </div>
                          <div>
                            <span className="font-medium text-purple-600">{user.premiumBusinesses || 0}</span>
                            <span className="text-gray-700"> premium</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-700">Joined:</span>
                            <div className="font-medium">
                              {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-700">Last active:</span>
                            <div className="font-medium">
                              {user.lastLoginAt 
                                ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Never'
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user)}
                            className="justify-start text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="justify-start text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="justify-start text-xs text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Cards - Mobile & Tablet */}
          <div className="lg:hidden space-y-4">
            {/* Mobile/Tablet Select All */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Select All ({users.length})</span>
              </label>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedUsers.length} selected
                </span>
              )}
            </div>

            {/* User Cards */}
            {users.map((user) => (
              <Card key={user.id} className={`${selectedUsers.includes(user.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUserSelect(user.id, e.target.checked)}
                        className="rounded border-gray-300 mt-1"
                        aria-label={`Select user ${user.firstName} ${user.lastName}`}
                      />
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-blue-600">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-700 break-all">{user.email}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          ID: {user.id?.slice(-8) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user)}
                  </div>

                  {/* Business Information */}
                  <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{user.totalBusinesses || 0}</div>
                      <div className="text-xs text-gray-700">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{user.claimedBusinesses || 0}</div>
                      <div className="text-xs text-gray-500">Claimed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{user.premiumBusinesses || 0}</div>
                      <div className="text-xs text-gray-500">Premium</div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <div className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Last active:</span>
                      <div className="font-medium">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="flex-1 text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing {users.length} of {totalCount} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Modals (for now, we'll use alerts) */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedUser.firstName} {selectedUser.lastName}? 
              This action cannot be undone and will remove the user from all claimed businesses.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal Placeholder */}
      {showUserEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <p className="text-gray-600 mb-4">
              User management modal will be implemented in the next phase.
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserEdit(false)
                  setSelectedUser(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal Placeholder */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Role:</strong> {selectedUser.role}
              </div>
              <div>
                <strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
              </div>
              <div>
                <strong>Businesses:</strong> {selectedUser.totalBusinesses || 0} total, {selectedUser.claimedBusinesses || 0} claimed
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserDetails(false)
                  setSelectedUser(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
