import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Key, CreditCard, Shield } from "lucide-react";
import type { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const { data: environments } = useQuery({
    queryKey: ["/api/environments"],
    enabled: isAuthenticated,
  });

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
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2" data-testid="text-settings-title">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">
            <Key className="h-4 w-4 mr-2" />
            API & Environments
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    data-testid="input-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={user.firstName || ""}
                      disabled
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName || ""}
                      disabled
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Management</CardTitle>
              <CardDescription>
                Manage your API environments and variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {environments && environments.length > 0 ? (
                  environments.map((env: any) => (
                    <div
                      key={env.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                      data-testid={`env-${env.id}`}
                    >
                      <div>
                        <p className="font-medium">{env.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {env.description || "No description"}
                        </p>
                      </div>
                      {env.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No environments yet. Create one in the Playground.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your billing and subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Current Plan</Label>
                  <p className="text-2xl font-bold capitalize mt-1">
                    {user.subscriptionStatus || "Free"}
                  </p>
                </div>
                {user.subscriptionStatus === "free" && (
                  <Button asChild data-testid="button-upgrade">
                    <a href="/pricing">Upgrade to Pro</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
