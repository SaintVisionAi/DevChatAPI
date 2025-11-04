import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-terms-title">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using the SaintSal™ AI Platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Permission is granted to temporarily access the Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software contained in the Service</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by SaintSal™ and are protected by international copyright, trademark, patent (including Patent #10,290,222), trade secret, and other intellectual property or proprietary rights laws.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>4. User Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                </p>
                <p>
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>You may not use the Service:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>In any way that violates any applicable national or international law or regulation</li>
                  <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
                  <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
                  <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                In no event shall SaintSal™, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this Service whether such liability is under contract, tort or otherwise.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at:{" "}
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
