import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Code2, Shield, Zap, Lock, Users, Terminal, Key, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const features = [
    {
      icon: MessageSquare,
      title: "Enterprise AI Chat",
      description: "Production-grade conversational AI with Claude and GPT integration, streaming responses, and full conversation management",
    },
    {
      icon: Terminal,
      title: "API Console & Playground",
      description: "Professional API testing environment with live request/response inspection, environment management, and full request history",
    },
    {
      icon: Key,
      title: "API Key Management",
      description: "Secure API key generation and issuance with granular permissions, usage tracking, and enterprise-grade encryption",
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Enterprise RBAC with admin, developer, and viewer roles. Granular permissions for teams and organizations",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Multi-user workspaces with shared environments, team-wide API configurations, and collaborative development tools",
    },
    {
      icon: BarChart3,
      title: "Analytics & Monitoring",
      description: "Real-time usage analytics, request monitoring, performance metrics, and comprehensive audit logs",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "SOC 2 compliant infrastructure, HIPAA-ready with BAA, end-to-end encryption, and enterprise SSO support",
    },
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description: "WebSocket-powered streaming architecture for instant AI responses and live API testing feedback",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-primary font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-lg">SaintSal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-pricing">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-docs">
              API Docs
            </Link>
            <Link href="/playground" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-playground">
              Playground
            </Link>
            <Button size="sm" asChild data-testid="button-nav-signin">
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with SaintSal™ Premium Styling */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 bg-primary/5 text-primary font-medium tracking-wide" data-testid="badge-patent">
            Protected by U.S. Patent #10,290,222
          </Badge>
          <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-tight leading-[0.95]" style={{fontWeight: 300}} data-testid="text-hero-title">
            <span className="font-semibold">Cookin' Knowledge</span>
            <br />
            <span className="text-primary font-bold tracking-tighter" style={{textShadow: '0 0 40px rgba(230, 179, 37, 0.3)'}}>Your Gotta Guy™</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light" data-testid="text-hero-description">
            AI Chat • <span className="text-accent">Web Search</span> • Voice • Code Agent • <span className="text-accent">Deep Research</span> • Everything
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/login">Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-view-docs">
              <Link href="/api-docs">View Documentation</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-playground">
              <Link href="/playground">Try Playground</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-6 border-y border-border bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">10M+</div>
              <div className="text-sm text-muted-foreground">API Requests/Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">&lt;100ms</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">SOC 2</div>
              <div className="text-sm text-muted-foreground">Type II Compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-features-title">
              Enterprise-Grade Infrastructure
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, test, and deploy AI-powered applications at scale
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Platform Features</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Professional API Console
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Full-featured API playground with environment management, request history, and real-time testing. Issue API keys, manage teams, and monitor usage all from a single console.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Environment Variables Management</div>
                    <div className="text-sm text-muted-foreground">Securely store and manage API keys, tokens, and configuration across multiple environments</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">API Key Issuance & Rotation</div>
                    <div className="text-sm text-muted-foreground">Generate, revoke, and rotate API keys with granular permissions and usage tracking</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Request History & Debugging</div>
                    <div className="text-sm text-muted-foreground">Complete audit trail of all API requests with detailed logging and performance metrics</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex items-center justify-center">
                <Terminal className="h-24 w-24 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6" data-testid="text-cta-title">
            Ready to Build at Scale?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join enterprise teams using SaintSal for production AI applications
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild data-testid="button-cta-signup">
              <a href="/login">Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-cta-contact">
              <a href="mailto:ryan@cookinknowledge.com">Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-primary font-bold text-lg">S</span>
                </div>
                <span className="font-semibold">SaintSal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise AI platform for professional developers and teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/api-docs" data-testid="link-footer-docs">API Documentation</Link></li>
                <li><Link href="/playground" data-testid="link-footer-playground">Playground</Link></li>
                <li><Link href="/login" data-testid="link-footer-login">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/terms" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/legal/baa" data-testid="link-footer-baa">Business Associate Agreement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:ryan@cookinknowledge.com" data-testid="link-footer-contact">Sales</a></li>
                <li><a href="mailto:ryan@cookinknowledge.com">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 SaintSal. All rights reserved.</p>
            <p>Protected by U.S. Patent #10,290,222</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
