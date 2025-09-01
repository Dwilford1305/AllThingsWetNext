"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { csrfFetch } from '@/lib/csrf';
import { Loader2, RefreshCcw, XCircle, Shield } from 'lucide-react';

interface SessionInfo {
  id: string;
  deviceInfo?: Record<string, unknown> | undefined;
  createdAt: string;
  lastUsedAt: string;
  expiresAt?: string;
  isActive: boolean;
  current: boolean;
}

function getBrowserName(deviceInfo?: Record<string, unknown>): string | undefined {
  if (!deviceInfo) return undefined;
  const ua = deviceInfo['ua'];
  if (ua && typeof ua === 'object') {
    const browser = (ua as Record<string, unknown>)['browser'];
    if (browser && typeof browser === 'object') {
      const name = (browser as Record<string, unknown>)['name'];
      if (typeof name === 'string') return name;
    }
  }
  return undefined;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/sessions', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.data);
      } else {
        setError(data.error || 'Failed to load sessions');
      }
  } catch (_e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    setRevoking(id); setError(null); setMessage(null);
    try {
      const res = await csrfFetch('/api/auth/sessions/revoke', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Session revoked');
        setSessions(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
      } else {
        setError(data.error || 'Failed to revoke');
      }
    } catch { setError('Network error'); }
    finally { setRevoking(null); }
  };

  const revokeAll = async (exceptCurrent: boolean) => {
    setBulkLoading(true); setError(null); setMessage(null);
    try {
      const res = await csrfFetch('/api/auth/sessions/revoke-all', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exceptCurrent }) });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || 'Sessions revoked');
        setSessions(prev => prev.map(s => (exceptCurrent && s.current) ? s : { ...s, isActive: false }));
      } else setError(data.error || 'Failed to revoke all');
    } catch { setError('Network error'); }
    finally { setBulkLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2"><Shield className="h-4 w-4" /> Active Sessions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCcw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => revokeAll(true)} disabled={bulkLoading || loading || sessions.length===0}>Revoke Others</Button>
          <Button variant="outline" size="sm" onClick={() => revokeAll(false)} disabled={bulkLoading || loading || sessions.length===0}>Revoke All</Button>
        </div>
      </div>
      {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">{message}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-600 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-600">No sessions found.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Card key={s.id} className={`p-3 flex items-center justify-between ${s.current ? 'border-blue-300' : ''}`}>
              <div className="text-sm">
                <div className="font-medium flex items-center gap-2">
                  {s.current && <span className="text-blue-600 text-xs font-semibold uppercase">Current</span>}
                  <span>{getBrowserName(s.deviceInfo) || 'Session'}</span>
                  {!s.isActive && <span className="text-gray-500 text-xs">(revoked)</span>}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                  <span>Created: {new Date(s.createdAt).toLocaleString()}</span>
                  <span>Last: {new Date(s.lastUsedAt).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <Button size="sm" variant="outline" disabled={revoking===s.id || !s.isActive || s.current} onClick={() => revoke(s.id)}>
                  {revoking===s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />Revoke</>}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
