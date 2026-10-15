import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StaffContext = createContext({ loading: true, allowed: false, signedIn: false });
export const useStaffAccess = () => useContext(StaffContext);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState({ loading: true, allowed: false, signedIn: false });
  useEffect(() => {
    let active = true;
    let version = 0;
    let userId: string | null = null;
    const refresh = async () => {
      const current = ++version;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const nextUserId = session?.user.id ?? null;
        if (active && current === version && nextUserId !== userId) {
          userId = nextUserId;
          setAccess({ loading: !!session, allowed: false, signedIn: !!session });
        }
        const { data, error } = session
          ? await supabase.rpc('is_onboarding_staff' as never)
          : { data: false, error: null };
        if (active && current === version) setAccess({ loading: false, allowed: !error && data === true, signedIn: !!session });
      } catch {
        if (active && current === version) setAccess({ loading: false, allowed: false, signedIn: false });
      }
    };
    void refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Preserve unsaved edits on same-user refresh; revoke access immediately on sign-out/user change.
      if ((session?.user.id ?? null) !== userId) {
        ++version;
        userId = session?.user.id ?? null;
        setAccess({ loading: !!session, allowed: false, signedIn: !!session });
      }
      // Defer Supabase calls until the auth callback releases its lock.
      window.setTimeout(() => { if (active) void refresh(); }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return <StaffContext.Provider value={access}>{children}</StaffContext.Provider>;
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { loading, allowed, signedIn } = useStaffAccess();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (loading) return <p className="p-8" role="status">Checking access…</p>;
  if (allowed) return <><div className="px-6 pt-4 text-right"><Button variant="ghost" onClick={() => supabase.auth.signOut()}>Sign out</Button></div>{children}</>;
  return <main className="min-h-screen bg-background px-4 py-16">
    <div className="mx-auto max-w-sm space-y-5 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-bold">Staff sign-in</h1>
      <p className="text-muted-foreground">Restaurant submissions are private. Sign in with your approved staff account.</p>
      {signedIn ? <><p role="alert">This account does not have access.</p><Button onClick={() => supabase.auth.signOut()}>Use another account</Button></> :
        <form className="space-y-4" onSubmit={async e => {
          e.preventDefault(); setBusy(true); setMessage('');
          try {
            if (codeSent) {
              const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
              if (error) setMessage('That code is invalid or expired. Request a new code and try again.');
            } else {
              const { error } = await supabase.functions.invoke('onboarding-staff-login', { body: { email: email.trim().toLowerCase() } });
              if (error) setMessage('Unable to send a sign-in code. Please try again shortly.');
              else { setCodeSent(true); setMessage('If this address has staff access, a sign-in code will arrive by email.'); }
            }
          } catch { setMessage('Unable to sign in. Please try again.'); }
          finally { setBusy(false); }
        }}>
          <div><Label htmlFor="staff-email">Email</Label><Input id="staff-email" type="email" autoComplete="username" readOnly={codeSent} value={email} onChange={e => setEmail(e.target.value)} required /></div>
          {codeSent && <div><Label htmlFor="staff-code">Email code</Label><Input id="staff-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required /></div>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : codeSent ? 'Sign in' : 'Email me a sign-in code'}</Button>
          {codeSent && <Button type="button" variant="ghost" onClick={() => { setCodeSent(false); setCode(''); setMessage(''); }}>Request a new code</Button>}
          {message && <p role="alert">{message}</p>}
        </form>}
      <a className="block text-sm underline" href="/onboarding">Go to the optional restaurant form</a>
    </div>
  </main>;
}
