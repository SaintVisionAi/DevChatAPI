import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ServiceWorkerRegistration() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration);

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    toast({
                      title: "Update Available",
                      description: "A new version is available. Refresh to update.",
                      action: (
                        <button
                          onClick={() => window.location.reload()}
                          className="px-3 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600"
                        >
                          Refresh
                        </button>
                      ),
                    });
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
      });

      // Handle offline/online events
      window.addEventListener('online', () => {
        toast({
          title: "Back Online",
          description: "Your connection has been restored.",
        });
      });

      window.addEventListener('offline', () => {
        toast({
          title: "You're Offline",
          description: "Some features may be limited without internet.",
          variant: "destructive",
        });
      });
    }
  }, [toast]);

  // Also handle install prompt for PWA
  useEffect(() => {
    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button after a delay
      setTimeout(() => {
        if (deferredPrompt) {
          toast({
            title: "Install App",
            description: "Add Cookin' Knowledge to your home screen for quick access.",
            action: (
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response: ${outcome}`);
                    deferredPrompt = null;
                  }
                }}
                className="px-3 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600"
              >
                Install
              </button>
            ),
            duration: 10000,
          });
        }
      }, 30000); // Show after 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  return null;
}