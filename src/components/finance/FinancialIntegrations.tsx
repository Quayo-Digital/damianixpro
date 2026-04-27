import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, Link, RefreshCw } from 'lucide-react';

interface IntegrationProvider {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

export function FinancialIntegrations() {
  const [providers, setProviders] = useState<IntegrationProvider[]>([
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      logo: 'https://quickbooks.intuit.com/cas/dam/IMAGE/A2NO17RNk/quickbooks_logo_primary.png',
      status: 'disconnected',
    },
    {
      id: 'xero',
      name: 'Xero',
      logo: 'https://www.xero.com/content/dam/xero/pilot-images/brand/logos/logo-xero-positive.svg',
      status: 'disconnected',
    },
    {
      id: 'sage',
      name: 'Sage',
      logo: 'https://www.sage.com/en-us/-/media/images/logos/sage_logo_green_rgb.png',
      status: 'disconnected',
    },
    {
      id: 'accessbank',
      name: 'Access Bank',
      logo: 'https://www.accessbankplc.com/images/home/logo.png',
      status: 'connected',
      lastSync: '2025-05-07 09:30 AM',
    },
    {
      id: 'gtbank',
      name: 'GTBank',
      logo: 'https://www.gtbank.com/assets/23/GTBank_Logo.png',
      status: 'disconnected',
    },
  ]);

  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setProviders((current) =>
        current.map((provider) =>
          provider.id === selectedProvider?.id
            ? {
                ...provider,
                status: 'connected',
                lastSync: new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }),
              }
            : provider
        )
      );

      toast.success(`Successfully connected to ${selectedProvider?.name}`);
      setApiKey('');
      setIsConnecting(false);
      setSelectedProvider(null);
    }, 2000);
  };

  const handleSync = (providerId: string) => {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              lastSync: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            }
          : provider
      )
    );

    toast.success(
      `Successfully synchronized with ${providers.find((p) => p.id === providerId)?.name}`
    );
  };

  const handleDisconnect = (providerId: string) => {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === providerId
          ? { ...provider, status: 'disconnected', lastSync: undefined }
          : provider
      )
    );

    toast.info(`Disconnected from ${providers.find((p) => p.id === providerId)?.name}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Integrations</CardTitle>
        <CardDescription>Connect with your banking and accounting software</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="max-h-[40px] max-w-[40px] object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/100x100?text=' + provider.name[0];
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <div className="mt-1 flex items-center">
                    <span
                      className={`h-2 w-2 rounded-full ${provider.status === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {provider.status === 'connected' ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  {provider.lastSync && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last sync: {provider.lastSync}
                    </p>
                  )}
                </div>
              </div>

              {provider.status === 'connected' ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSync(provider.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDisconnect(provider.id)}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Link className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Connect to {selectedProvider?.name}</DialogTitle>
                      <DialogDescription>
                        Enter your API credentials to connect with {selectedProvider?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can find your API key in your {selectedProvider?.name} account settings.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Connecting your financial accounts allows for automatic synchronization of transactions
          and balances.
        </p>
      </CardFooter>
    </Card>
  );
}
