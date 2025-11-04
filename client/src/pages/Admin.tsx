import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Database, Shield } from "lucide-react";
import type { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function Admin() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-semibold" data-testid="text-admin-title">
            Admin Panel
          </h1>
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

      {/* Users List */}
      <Card data-testid="card-users-list">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allUsers && allUsers.length > 0 ? (
              allUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                  data-testid={`user-row-${u.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {u.firstName && u.lastName
                          ? `${u.firstName} ${u.lastName}`
                          : u.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {u.subscriptionStatus}
                    </Badge>
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
    </div>
  );
}
