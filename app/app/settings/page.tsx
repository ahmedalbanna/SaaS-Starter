import { auth } from '@/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, User, Lock, Key, Server } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Account Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Configure personal preferences, authentication credentials, and workspace security.
        </p>
      </div>

      {/* Profile Details Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-600" />
            <span>Profile Details</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Your personal identity across teams and activity logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-neutral-700">Display Name</label>
              <Input defaultValue={user?.name || ''} readOnly className="bg-neutral-50" />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-neutral-700">Email Address</label>
              <Input defaultValue={user?.email || ''} readOnly className="bg-neutral-50" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-semibold text-neutral-900">Account Role</span>
              <p className="text-neutral-500 text-[11px]">Assigned RBAC permissions</p>
            </div>
            <Badge variant="outline" className="font-mono uppercase text-xs">
              {(user as any)?.role || 'User'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security & Authentication Protocol Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-600" />
            <span>Security &amp; Session Configuration</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Architecture parameters verified for Auth.js session handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs divide-y divide-neutral-100">
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-medium text-neutral-900">Password Hashing</span>
              <p className="text-neutral-500 text-[11px]">Bcrypt with 10 salted key-stretching iterations</p>
            </div>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono">
              bcryptjs
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-medium text-neutral-900">Session Strategy</span>
              <p className="text-neutral-500 text-[11px]">Stateless signed JSON Web Tokens (Auth.js v5)</p>
            </div>
            <span className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px] font-mono">
              JWT (30-day maxAge)
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="font-medium text-neutral-900">Stripe Webhook Signature Verification</span>
              <p className="text-neutral-500 text-[11px]">HMAC-SHA256 signature checking</p>
            </div>
            <span className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px] font-mono">
              Stripe SDK v2025
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
