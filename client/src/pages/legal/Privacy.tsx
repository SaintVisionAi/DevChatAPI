import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and email address</li>
                  <li>Account credentials</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Chat messages and API requests</li>
                  <li>Usage data and analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. All data is encrypted in transit and at rest.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>4. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Chat messages and API data are retained according to your subscription plan.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the following third-party services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Stripe for payment processing</li>
                  <li>OpenAI and Anthropic for AI services</li>
                  <li>Cloud hosting providers for infrastructure</li>
                </ul>
                <p>
                  These services have their own privacy policies and we recommend reviewing them.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Export your data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:{" "}
                <a href="mailto:ryan@cookinknowledge.com" className="text-primary hover:underline">
                  ryan@cookinknowledge.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
