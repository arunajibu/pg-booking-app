import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Signup
  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert('Signup successful! Check your email.');
  };

  // Login
  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      {!session ? (
        <div className="auth-container">
          <div className="auth-header">
            <h2>🏠 RentalHub</h2>
            <p>Sign in to manage your property bookings</p>
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="button-group">
            <button onClick={login}>Login</button>
            <button onClick={signUp}>Sign Up</button>
          </div>
        </div>
      ) : (
        <div className="welcome-container">
          <h2>Welcome to RentalHub 🎉</h2>
          <div className="user-email">
            {session.user.email}
          </div>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Start managing your property rentals and bookings
          </p>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
