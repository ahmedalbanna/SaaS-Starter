'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Copy, Check, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

interface KeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = React.useState<KeyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [keyName, setKeyName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const refreshKeys = React.useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/keys');
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setKeys(data.keys || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.key);
        setKeyName('');
        refreshKeys();
      }
    } catch (err) {
      alert('Failed to generate key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action is irreversible.')) return;
    try {
      await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      setKeys(keys.filter((k) => k.id !== id));
    } catch (err) {
      alert('Failed to delete key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          API Keys &amp; Ingestion Tokens
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Create and revoke access tokens for external service ingestion and automated workflows.
        </p>
      </div>

      {/* Newly Created Key Alert (Secret Display) */}
      {newlyCreatedKey && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-700" />
              API Key Generated Successfully
            </span>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-emerald-700 font-bold hover:text-emerald-950"
            >
              Done
            </button>
          </div>
          <p className="text-[11px] text-emerald-800">
            Please copy this key now. For security purposes, you will not be able to see the full secret again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-white border border-emerald-200 p-2 font-mono text-xs text-neutral-900 select-all overflow-x-auto">
              {newlyCreatedKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(newlyCreatedKey)}
              className="text-xs shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Create Key Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-neutral-600" />
            <span>Generate New API Key</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Keys authenticate requests to your SaaS endpoints via Bearer header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              required
              placeholder="e.g. Production Ingestion Service"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="text-xs flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isCreating}
              className="text-xs font-medium shrink-0"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Generate Secret Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Keys Table Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-neutral-600" />
            <span>Active Keys ({keys.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No API keys created yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900">{k.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {k.prefix}...
                      </Badge>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Created on {new Date(k.createdAt).toLocaleDateString()}
                      {k.lastUsedAt ? ` • Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' • Never used'}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(k.id)}
                    className="text-neutral-400 hover:text-red-600 h-8 w-8"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
