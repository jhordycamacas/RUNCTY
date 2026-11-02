'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { authErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { Alert } from '@/core/ui/feedback';
import { TextField } from '@/core/ui/fields';

import { AccessDeniedError, signInAdmin } from '../infrastructure/firebaseAdminAuth';
import { useSession } from './SessionProvider';

export function LoginScreen() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'signedIn') router.replace('/usuarios');
  }, [status, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      await signInAdmin(email, password);
      router.replace('/usuarios');
    } catch (err) {
      setError(err instanceof AccessDeniedError ? err.message : authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-widest text-brand">RUNCTY</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted">Acceso exclusivo para personal autorizado.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          {error ? <Alert>{error}</Alert> : null}
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Iniciar sesión
          </Button>
        </form>
      </div>
    </main>
  );
}
