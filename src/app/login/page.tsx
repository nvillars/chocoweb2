"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { use } from 'react';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [role, setRole] = useState<'user'|'admin'>('user');
  const { login } = useAuth();
  const toast = useToast();
  const [remember, setRemember] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo password check: require known passwords for demo accounts
    if (email.toLowerCase() === 'admin@ladulceria.test') {
      if (loginPassword !== 'Admin123!') {
  toast.push({ message: 'Contraseña de admin incorrecta' });
        return;
      }
    }
    if (email.toLowerCase() === 'user@ladulceria.test') {
      if (loginPassword !== 'User123!') {
  toast.push({ message: 'Contraseña de usuario incorrecta' });
        return;
      }
    }

    login(email, role);
    window.location.href = '/';
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegError(null);
    if (!firstName.trim() || !lastName.trim()) return setRegError('Por favor ingresa nombres y apellidos');
    if (!regEmail.includes('@')) return setRegError('Correo inválido');
    if (password.length < 6) return setRegError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirmPassword) return setRegError('Las contraseñas no coinciden');

    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${firstName.trim()} ${lastName.trim()}`, email: regEmail.trim(), role: 'user' }) });
      if (res.status === 409) return setRegError('Ya existe un usuario con ese correo');
      if (!res.ok) return setRegError('Error al crear la cuenta');
      const created = await res.json();
      // auto-login demo
      login(created.email, 'user');
      toast.push({ message: 'Cuenta creada y sesión iniciada' });
      window.location.href = '/';
    } catch (err) {
      setRegError('Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <i className="fa-solid fa-right-to-bracket icon-md"></i>
              Login
            </h2>
            <div className="text-sm">
              <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true); }} className="hover:underline">Register</a>
            </div>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input className="form-input" placeholder="correo@dominio.test" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                <input type="password" className="form-input" placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4" />
                  <label htmlFor="remember" className="text-gray-600">Remember me?</label>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 text-gray-700"><input type="radio" checked={role==='user'} onChange={() => setRole('user')} /> Usuario</label>
                  <label className="flex items-center gap-2 text-gray-700"><input type="radio" checked={role==='admin'} onChange={() => setRole('admin')} /> Admin</label>
                </div>
              </div>

              <div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-3">
                  <i className="fa-solid fa-right-to-bracket icon-sm"></i>
                  <span>Login</span>
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">Don&apos;t have an account? <button onClick={() => setShowRegister(true)} className="text-blue-600 underline">Register here</button></div>

              <div className="mt-4 bg-blue-50 border-l-4 border-blue-300 p-4 rounded">
                <div className="text-sm text-blue-900 font-semibold">Demo Admin Account:</div>
                <div className="text-sm text-gray-700 mt-1">Email: <span className="font-medium">admin@ladulceria.test</span></div>
                <div className="text-sm text-gray-700">Password: <span className="font-medium">Admin123!</span></div>
                <div className="mt-3 text-sm text-blue-900 font-semibold">Demo User Account:</div>
                <div className="text-sm text-gray-700 mt-1">Email: <span className="font-medium">user@ladulceria.test</span></div>
                <div className="text-sm text-gray-700">Password: <span className="font-medium">User123!</span></div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de registro */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRegister(false)} />
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-3"><span className="text-2xl">➕</span> Crear cuenta</h3>
                <button onClick={() => setShowRegister(false)} className="text-white">✕</button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Nombres</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 border rounded mt-1" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-3 border rounded mt-1" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Correo</label>
                  <input value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-3 border rounded mt-1" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded mt-1" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded mt-1" />
                </div>
              </div>
              <div className="p-6 border-t flex items-center justify-between">
                <div className="text-sm text-red-600">{regError}</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowRegister(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
                  <button onClick={handleRegister} className="px-6 py-2 bg-green-700 text-white rounded">Crear cuenta</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
