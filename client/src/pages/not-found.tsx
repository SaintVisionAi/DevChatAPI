import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary mb-4" data-testid="text-404">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild data-testid="button-home">
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-contact">
            <a href="mailto:ryan@cookinknowledge.com">Contact Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
