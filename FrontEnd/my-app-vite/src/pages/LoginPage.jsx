import React, { useState } from 'react';
import Logo from '../components/Logo';
import InputField from '../components/InputField';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pwError, setPwError] = useState('');

  const validate = () => {
    let valid = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (password.length < 6) {
      setPwError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPwError('');
    }
    return valid;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const parts = email.split('@')[0].split('.');
    const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const initials = parts.map(p => p[0].toUpperCase()).join('').slice(0, 2);
    onLogin({ name, email, initials });
  };

  const handleDemo = () => {
    onLogin({ name: 'Demo User', email: 'demo@vault.io', initials: 'DU' });
  };

  return (
    <div style={{
      background: '#ffffff', border: '0.5px solid #d3d1c7',
      borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420, padding: '2rem',
    }}>
      <div style={{ marginBottom: '2rem' }}><Logo /></div>

      <h2 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: '0.35rem' }}>
        Welcome back
      </h2>
      <p style={{ fontSize: 13, color: '#888780', marginBottom: '1.75rem' }}>
        Sign in to your account to continue.
      </p>

      <InputField
        label="Email" type="email" value={email} onChange={setEmail}
        onKeyDown={e => e.key === 'Enter' && document.getElementById('pw-input')?.focus()}
        placeholder="you@example.com" error={emailError} autoFocus
      />
      <InputField
        label="Password" type="password" value={password} onChange={setPassword}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="••••••••" error={pwError}
      />

      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 500,
          fontFamily: 'var(--font)', background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          marginTop: '0.5rem', transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Sign in
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.25rem 0' }}>
        <div style={{ flex: 1, height: '0.5px', background: '#d3d1c7' }} />
        <span style={{ fontSize: 12, color: '#b4b2a9' }}>or</span>
        <div style={{ flex: 1, height: '0.5px', background: '#d3d1c7' }} />
      </div>

      <button
        onClick={handleDemo}
        style={{
          width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 500,
          fontFamily: 'var(--font)', background: 'transparent', color: '#1a1a18',
          border: '0.5px solid #c4c2b8', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f1efe8')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        Continue as demo user
      </button>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: '#888780' }}>
        Don't have an account?{' '}
        <a
          href="#"
          onClick={e => { e.preventDefault(); alert('Sign up flow coming soon!'); }}
          style={{ color: 'var(--accent-text)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Sign up
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
