import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch rooms
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*');

    if (error) {
      alert(error.message);
    } else {
      setRooms(data);
    }
  };

  // Load rooms after login
  useEffect(() => {
    if (session) {
      fetchRooms();
    }
  }, [session]);

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
      {/* AUTH SCREEN */}
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
        /* DASHBOARD */
        <div className="welcome-container">
          <h2>Welcome to RentalHub 🎉</h2>

          <div className="user-email">
            {session.user.email}
          </div>

          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Start managing your property rentals and bookings
          </p>

          <button onClick={logout} className="logout-btn">
            Logout
          </button>

          <hr style={{ margin: '2rem 0' }} />

          {/* ROOMS LIST */}
          <h3>Available Rooms</h3>

          {rooms.length === 0 ? (
            <p>No rooms available</p>
          ) : (
            <div className="rooms-container">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="room-image"
                  />
                  <div className="room-content">
                    <h4>{room.name}</h4>

                    <p className="room-desc">
                      {room.description}
                    </p>

                    <p><strong>Price:</strong> ₹{room.price}</p>

                    <p><strong>Capacity:</strong> {room.capacity} Person(s)</p>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
