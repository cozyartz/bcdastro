import { useState } from 'react';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/signup';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Error: ' + (await res.text()));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg max-w-sm mx-auto">
      <h2 className="text-white text-xl mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        {isLogin ? 'Login' : 'Sign Up'}
      </button>
      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="text-blue-400 mt-2"
      >
        {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
      </button>
    </form>
  );
}