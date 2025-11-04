import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Baa() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-baa-title">
            Business Associate Agreement (BAA)
          </h1>
          <p className="text-muted-foreground">
            HIPAA Compliant - Last updated: January 2025
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  This Business Associate Agreement ("Agreement") supplements and is made a part of the Terms of Service between you ("Covered Entity") and SaintSal™ ("Business Associate").
                </p>
                <p>
                  Terms used but not otherwise defined in this Agreement shall have the same meaning as those terms in the Health Insurance Portability and Accountability Act of 1996, as amended ("HIPAA").
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. Permitted Uses and Disclosures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Business Associate may use or disclose Protected Health Information (PHI) only as permitted or required by this Agreement or as Required by Law.
                </p>
                <p>Business Associate shall not use or disclose PHI in any manner that would constitute a violation of the Privacy Rule if used or disclosed by Covered Entity.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>3. Obligations of Business Associate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>Business Associate agrees to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Not use or disclose PHI other than as permitted by this Agreement</li>
                  <li>Use appropriate safeguards to prevent use or disclosure of PHI</li>
                  <li>Report to Covered Entity any use or disclosure not provided for by this Agreement</li>
                  <li>Ensure that any agents to whom it provides PHI agree to the same restrictions</li>
                  <li>Make available PHI for amendment and incorporate any amendments as directed by Covered Entity</li>
                  <li>Make available information required to provide an accounting of disclosures</li>
                  <li>Make internal practices, books, and records relating to PHI available to the Secretary</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>4. Security Standards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Business Associate shall implement administrative, physical, and technical safeguards that reasonably and appropriately protect the confidentiality, integrity, and availability of electronic PHI that it creates, receives, maintains, or transmits on behalf of Covered Entity.
                </p>
                <p>These safeguards include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Access controls and authentication</li>
                  <li>Audit logging and monitoring</li>
                  <li>Regular security assessments</li>
                  <li>Incident response procedures</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>5. Breach Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Business Associate shall notify Covered Entity within 24 hours of discovery of any breach of unsecured PHI. The notification shall include the identification of each individual whose unsecured PHI has been, or is reasonably believed to have been, accessed, acquired, used, or disclosed during the breach.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>6. Term and Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  This Agreement shall be effective on the date of the Terms of Service and shall terminate when all PHI provided by Covered Entity to Business Associate, or created or received by Business Associate on behalf of Covered Entity, is destroyed or returned to Covered Entity.
                </p>
                <p>
                  Upon termination, Business Associate shall return or destroy all PHI received from Covered Entity that Business Associate still maintains in any form, and retain no copies.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact for BAA Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For execution of a formal BAA document or questions about HIPAA compliance, please contact:{" "}
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
