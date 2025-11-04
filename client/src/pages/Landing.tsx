import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Code2, Shield, Zap, Lock, Globe, Check } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat Interface",
      description: "Streaming responses from Claude and GPT with beautiful, Apple-inspired UI",
    },
    {
      icon: Code2,
      title: "API Playground",
      description: "Test and showcase APIs with environment variable management",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Admin, developer, and viewer roles with granular permissions",
    },
    {
      icon: Lock,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with full BAA compliance",
    },
    {
      icon: Zap,
      title: "Real-time Streaming",
      description: "WebSocket-powered streaming for instant AI responses",
    },
    {
      icon: Globe,
      title: "White Label Ready",
      description: "Fully customizable platform for your brand",
    },
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        "100 AI messages/month",
        "Basic API playground",
        "Community support",
        "2 environments",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "49",
      description: "For professional developers",
      features: [
        "Unlimited AI messages",
        "Advanced API playground",
        "Priority support",
        "Unlimited environments",
        "Custom integrations",
        "Team collaboration",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Dedicated support",
        "Custom SLA",
        "On-premise deployment",
        "Advanced security",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <Badge variant="secondary" className="mb-6" data-testid="badge-hero">
            Powered by Patent #10,290,222
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight" data-testid="text-hero-title">
            Enterprise AI Platform
            <br />
            <span className="text-primary">Built for Developers</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto" data-testid="text-hero-description">
            The only AI chat platform with integrated API playground, environment management,
            and role-based access controls. Similar to Claude.ai and ChatGPT, but built for your business.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Get Started Free</a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-view-docs">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-semibold mb-4" data-testid="text-features-title">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform for AI interaction and API development
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-semibold mb-4" data-testid="text-pricing-title">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative ${tier.highlighted ? "border-primary shadow-lg scale-105" : "border-border"}`}
                data-testid={`card-pricing-${tier.name.toLowerCase()}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="default" data-testid="badge-popular">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold" data-testid={`text-price-${tier.name.toLowerCase()}`}>
                      {tier.price === "Custom" ? tier.price : `$${tier.price}`}
                    </span>
                    {tier.price !== "Custom" && (
                      <span className="text-muted-foreground text-lg">/month</span>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "outline"}
                    size="lg"
                    asChild
                    data-testid={`button-cta-${tier.name.toLowerCase()}`}
                  >
                    <a href="/api/login">{tier.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-6" data-testid="text-cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join thousands of developers building with SaintSal™ AI Platform
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild data-testid="button-cta-signup">
              <a href="/api/login">Sign Up Free</a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-cta-contact">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/docs" data-testid="link-footer-docs">Documentation</Link></li>
                <li><Link href="/api/login" data-testid="link-footer-login">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/terms" data-testid="link-footer-terms">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" data-testid="link-footer-privacy">Privacy Policy</Link></li>
                <li><Link href="/legal/baa" data-testid="link-footer-baa">BAA Agreement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:ryan@cookinknowledge.com" data-testid="link-footer-contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">SaintSal™ AI</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise AI Platform with patented technology for scalable virtual environments.
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 SaintSal™. All rights reserved. Patent #10,290,222</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
