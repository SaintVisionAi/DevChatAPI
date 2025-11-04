import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const tiers = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        "100 AI messages/month",
        "Basic API playground",
        "Community support",
        "2 environments",
        "Basic documentation",
      ],
      cta: isAuthenticated ? "Current Plan" : "Get Started",
      href: isAuthenticated ? "/dashboard" : "/api/login",
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
        "Advanced analytics",
        "API access",
      ],
      cta: "Start Free Trial",
      href: "/subscribe",
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
        "White label options",
        "Training & onboarding",
      ],
      cta: "Contact Sales",
      href: "mailto:ryan@cookinknowledge.com",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6" data-testid="text-pricing-title">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Choose the plan that fits your needs. All plans include core features.
          </p>
          <Badge variant="secondary" className="mb-8">
            30-day money-back guarantee
          </Badge>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative flex flex-col ${
                  tier.highlighted ? "border-primary shadow-xl scale-105" : "border-border"
                }`}
                data-testid={`card-tier-${tier.name.toLowerCase()}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="default" data-testid="badge-most-popular">
                      Most Popular
                    </Badge>
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
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-auto"
                    variant={tier.highlighted ? "default" : "outline"}
                    size="lg"
                    asChild
                    data-testid={`button-tier-${tier.name.toLowerCase()}`}
                  >
                    <a href={tier.href}>{tier.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
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
