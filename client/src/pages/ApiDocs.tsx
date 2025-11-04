import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "lucide-react";

export default function ApiDocs() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/chat",
      description: "Send a chat message and get AI response",
      requestExample: `{
  "conversationId": "uuid",
  "message": "Hello, AI!",
  "model": "claude-sonnet-4-5"
}`,
      responseExample: `{
  "id": "uuid",
  "content": "Hello! How can I help you today?",
  "role": "assistant",
  "createdAt": "2025-01-01T00:00:00Z"
}`,
    },
    {
      method: "GET",
      path: "/api/conversations",
      description: "List all conversations",
      responseExample: `[
  {
    "id": "uuid",
    "title": "Chat about AI",
    "model": "claude-sonnet-4-5",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]`,
    },
    {
      method: "POST",
      path: "/api/environments",
      description: "Create a new API environment",
      requestExample: `{
  "name": "Production",
  "description": "Production environment",
  "isDefault": true
}`,
      responseExample: `{
  "id": "uuid",
  "name": "Production",
  "description": "Production environment",
  "isDefault": true,
  "createdAt": "2025-01-01T00:00:00Z"
}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Code className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" data-testid="text-docs-title">
                API Documentation
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Complete reference for the SaintSal™ AI Platform API
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to authenticate and make your first API request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All API requests require authentication using your API key. Include it in the Authorization header:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono">
                    {`Authorization: Bearer YOUR_API_KEY`}
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono">
                    {`https://api.saintsal.ai/v1`}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <h2 className="text-2xl font-semibold mb-6">API Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <Card key={index} data-testid={`card-endpoint-${index}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={endpoint.method === "GET" ? "default" : "secondary"}
                      data-testid={`badge-method-${index}`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="request" data-testid={`tab-request-${index}`}>Request</TabsTrigger>
                      <TabsTrigger value="response" data-testid={`tab-response-${index}`}>Response</TabsTrigger>
                      <TabsTrigger value="examples" data-testid={`tab-examples-${index}`}>Examples</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request" className="mt-4">
                      {endpoint.requestExample ? (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <code className="text-sm font-mono" data-testid={`code-request-${index}`}>
                            {endpoint.requestExample}
                          </code>
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground">No request body required</p>
                      )}
                    </TabsContent>
                    <TabsContent value="response" className="mt-4">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm font-mono" data-testid={`code-response-${index}`}>
                          {endpoint.responseExample}
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="examples" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm">cURL</h4>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm font-mono">
                              {`curl -X ${endpoint.method} https://api.saintsal.ai/v1${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${
    endpoint.requestExample
      ? ` \\\n  -d '${endpoint.requestExample.replace(/\n/g, "").replace(/\s+/g, " ")}'`
      : ""
  }`}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
