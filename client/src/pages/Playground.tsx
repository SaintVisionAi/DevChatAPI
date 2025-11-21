import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Play, Copy, Check, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, ApiEnvironment } from "@shared/schema";

export default function Playground() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
    isAuthenticated: boolean;
  };

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("{}");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: environments } = useQuery<ApiEnvironment[]>({
    queryKey: ["/api/environments"],
    enabled: isAuthenticated,
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const startTime = Date.now();
      const result = await apiRequest("POST", "/api/playground/execute", {
        environmentId: selectedEnvironment,
        method,
        url,
        headers: JSON.parse(headers || "{}"),
        body: body || undefined,
      });
      const endTime = Date.now();
      return { result, responseTime: endTime - startTime };
    },
    onSuccess: ({ result, responseTime }) => {
      const typedResult = result as any;
      setResponse(JSON.stringify(typedResult.data, null, 2));
      setStatusCode(typedResult.status);
      setResponseTime(responseTime);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to execute request",
        variant: "destructive",
      });
    },
  });

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <div>
          <h1 className="font-semibold text-xl" data-testid="text-playground-title">
            API Playground
          </h1>
          <p className="text-sm text-muted-foreground">
            Test and explore APIs with environment management
          </p>
        </div>
        <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
          <SelectTrigger className="w-64" data-testid="select-environment">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            {environments?.map((env) => (
              <SelectItem key={env.id} value={env.id} data-testid={`option-env-${env.id}`}>
                {env.name}
              </SelectItem>
            ))}
            <SelectItem value="create-new" data-testid="option-create-env">
              <Plus className="h-4 w-4 inline mr-2" />
              Create New Environment
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Panel */}
        <div className="w-2/5 border-r border-border overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="method" className="mb-2 block">Request Method</Label>
              <Tabs value={method} onValueChange={setMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="GET" data-testid="tab-method-get">GET</TabsTrigger>
                  <TabsTrigger value="POST" data-testid="tab-method-post">POST</TabsTrigger>
                  <TabsTrigger value="PUT" data-testid="tab-method-put">PUT</TabsTrigger>
                  <TabsTrigger value="DELETE" data-testid="tab-method-delete">DELETE</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label htmlFor="url" className="mb-2 block">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                data-testid="input-url"
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="headers">
                <AccordionTrigger data-testid="accordion-headers">Headers</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder='{"Content-Type": "application/json"}'
                    className="font-mono text-sm min-h-[120px]"
                    data-testid="input-headers"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {(method === "POST" || method === "PUT") && (
              <div>
                <Label htmlFor="body" className="mb-2 block">Request Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[300px]"
                  data-testid="input-body"
                />
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => executeMutation.mutate()}
              disabled={!url || !selectedEnvironment || executeMutation.isPending}
              data-testid="button-execute"
            >
              {executeMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Request
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card data-testid="card-response">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response</CardTitle>
                <div className="flex items-center gap-3">
                  {responseTime !== null && (
                    <Badge variant="outline" data-testid="badge-response-time">
                      {responseTime}ms
                    </Badge>
                  )}
                  {statusCode !== null && (
                    <Badge
                      variant={statusCode >= 200 && statusCode < 300 ? "default" : "destructive"}
                      data-testid="badge-status-code"
                    >
                      {statusCode}
                    </Badge>
                  )}
                  {response && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyResponse}
                      data-testid="button-copy-response"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {response ? (
                <Tabs defaultValue="response" className="w-full">
                  <TabsList>
                    <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
                    <TabsTrigger value="headers" data-testid="tab-response-headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono" data-testid="text-response">
                        {response}
                      </code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="headers" className="mt-4">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono">
                        {JSON.stringify({ "Content-Type": "application/json" }, null, 2)}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <p>No response yet</p>
                  <p className="text-sm mt-2">Execute a request to see the response here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
