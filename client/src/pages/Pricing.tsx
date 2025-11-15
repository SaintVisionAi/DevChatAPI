import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Shield, Users, Zap, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 Type II compliant with end-to-end encryption, SSO, and HIPAA-ready infrastructure"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Multi-user workspaces, role-based access controls, shared environments, and team API keys"
    },
    {
      icon: Zap,
      title: "Unlimited API Access",
      description: "No rate limits on API playground, unlimited environments, and comprehensive request history"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - only show for unauthenticated users */}
      {!isAuthenticated && (
        <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-primary font-bold text-base sm:text-lg">S</span>
              </div>
              <span className="font-semibold text-base sm:text-lg">SaintSal</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-sm text-foreground font-medium">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                API Docs
              </Link>
              <Button size="sm" asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={cn(
              "md:hidden absolute top-full left-0 right-0 bg-background border-b border-border transition-all duration-300 ease-in-out",
              mobileMenuOpen 
                ? "max-h-screen opacity-100" 
                : "max-h-0 opacity-0 overflow-hidden"
            )}
          >
            <div className="px-3 py-4 space-y-3">
              <Link 
                href="/" 
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/pricing" 
                className="block px-3 py-2 text-sm text-foreground font-medium bg-muted/50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/docs" 
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                API Docs
              </Link>
              <div className="pt-2">
                <Button asChild className="w-full">
                  <a href="/login">Sign In</a>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <section className={`py-20 px-6 border-b border-border ${!isAuthenticated ? 'pt-32' : ''}`}>
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 border-primary/30">
            Protected by U.S. Patent #10,290,222
          </Badge>
          <h1 className="text-5xl font-bold mb-6" data-testid="text-pricing-title">
            Choose Your Intelligence Level
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Free to start • $20 for unlimited • $97 for pro power • $297 for enterprise teams
          </p>
        </div>
      </section>
      
      {/* Pricing Tiers */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tier */}
            <Card className="relative p-6 flex flex-col border-border hover-elevate" data-testid="card-pricing-free">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Free</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Perfect for trying out SaintSal
                </p>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>100 messages per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Basic chat mode</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Standard response time</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Community support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild data-testid="button-get-started-free">
                <Link href="/chat">Get Started</Link>
              </Button>
            </Card>

            {/* Unlimited Starter - $20 */}
            <Card className="relative p-6 flex flex-col border-border ring-2 ring-primary shadow-lg shadow-primary/20 hover-elevate" data-testid="card-pricing-starter">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground" data-testid="badge-popular">
                Most Popular
              </Badge>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <Zap className="h-5 w-5 text-[#4DA6FF]" />
                </div>
                <h3 className="text-xl font-bold">Unlimited Starter</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Unlimited AI power for individuals
                </p>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Unlimited messages</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>All 5 AI modes (Chat, Search, Research, Code, Voice)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Voice conversations (ElevenLabs)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Image generation (DALL-E & Grok)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Extended memory system</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button className="w-full" data-testid="button-upgrade-starter">
                Upgrade to Starter
              </Button>
            </Card>

            {/* Pro - $97 */}
            <Card className="relative p-6 flex flex-col border-border hover-elevate" data-testid="card-pricing-pro">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <Shield className="h-5 w-5 text-[#E6B325]" />
                </div>
                <h3 className="text-xl font-bold">Pro</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$97</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Advanced features for power users
                </p>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Everything in Unlimited Starter</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>10x faster response times</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Advanced AI models</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Custom AI personalities</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>White-glove support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" data-testid="button-upgrade-pro">
                Upgrade to Pro
              </Button>
            </Card>

            {/* Enterprise - $297 */}
            <Card className="relative p-6 flex flex-col border-border hover-elevate" data-testid="card-pricing-enterprise">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <Users className="h-5 w-5 text-[#E6B325]" />
                </div>
                <h3 className="text-xl font-bold">Enterprise</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$297</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete solution for teams
                </p>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>5 team seats included</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Up to 5 verified domains</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Team memory (extended)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Shared knowledge base</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Admin dashboard</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>99.9% uptime SLA</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" data-testid="button-upgrade-enterprise">
                Upgrade to Enterprise
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Features */}
      <section className="py-20 px-6 border-t border-border bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Teams</h2>
            <p className="text-lg text-muted-foreground">
              Collaborate with your entire organization on AI development
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Role-Based Access Control
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Admin, Developer, and Viewer roles with granular permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Team workspaces with shared environments and API configurations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Audit logs and activity monitoring for compliance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  API Console & Key Management
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Generate and manage API keys with custom permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Environment variable management across development stages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Complete request history and performance analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards through Stripe. Enterprise customers can arrange for invoice billing.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! The Pro plan comes with a 14-day free trial. No credit card required to start.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
