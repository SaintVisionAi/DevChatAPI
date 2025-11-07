import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Activity, Database, Shield, Plus, Edit, Search } from "lucide-react";
import type { User } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "viewer" as "admin" | "developer" | "viewer",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please login to continue...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }

    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "viewer",
    });
  };

  const handleAddUser = () => {
    setAddDialogOpen(true);
    resetForm();
  };

  const handleEditUser = (u: User) => {
    setSelectedUser(u);
    setFormData({
      email: u.email,
      password: "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      phone: u.phone || "",
      role: u.role,
    });
    setEditDialogOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedUser) return;
    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    const updates: Partial<typeof formData> = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      role: formData.role,
    };
    
    if (formData.password) {
      updates.password = formData.password;
    }
    
    updateUserMutation.mutate({ id: selectedUser.id, data: updates });
  };

  const filteredUsers = allUsers?.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.lastName && u.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-semibold" data-testid="text-admin-title">
              Admin Panel
            </h1>
          </div>
          <Badge variant="outline" className="text-sm">
            {user?.email}
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          System administration and user management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card data-testid="card-stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-active-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-total-conversations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-api-calls">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.totalApiCalls || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card data-testid="card-users-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Create, view, and manage all users</CardDescription>
            </div>
            <Button onClick={handleAddUser} data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                  data-testid={`user-row-${u.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {u.firstName && u.lastName
                            ? `${u.firstName} ${u.lastName}`
                            : u.email}
                        </p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        {u.phone && (
                          <p className="text-sm text-muted-foreground">{u.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {u.subscriptionStatus}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditUser(u)}
                      data-testid={`button-edit-user-${u.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-user">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email, password, and role
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email*</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-add-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">Password*</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="input-add-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-firstName">First Name</Label>
              <Input
                id="add-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-add-firstName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-lastName">Last Name</Label>
              <Input
                id="add-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-add-lastName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-add-phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={createUserMutation.isPending}
              data-testid="button-submit-add-user"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information, role, or password
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email*</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                data-testid="input-edit-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                data-testid="input-edit-firstName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                data-testid="input-edit-lastName"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-edit-phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateUserMutation.isPending}
              data-testid="button-submit-edit-user"
            >
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
