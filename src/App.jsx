import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // -------------------------------
  // AUTH SESSION
  // -------------------------------
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

  // -------------------------------
  // FETCH ROOMS
  // -------------------------------
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

  // -------------------------------
  // HANDLE BOOKING
  // -------------------------------
  const handleBook = async (roomId) => {
    const startDate = prompt('Enter start date (YYYY-MM-DD)');
    const endDate = prompt('Enter end date (YYYY-MM-DD)');

    if (!startDate || !endDate) {
      alert('Please enter both dates');
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .insert([
        {
          room_id: roomId,
          user_id: session.user.id,
          check_in: startDate,
          check_out: endDate,
          status: 'pending',
        },
      ]);

    if (error) {
      alert(error.message);
    } else {
      alert('Booking successful 🎉');
    }
  };

  // -------------------------------
  // LOAD ROOMS AFTER LOGIN
  // -------------------------------
  useEffect(() => {
    if (session) {
      fetchRooms();
    }
  }, [session]);

  // -------------------------------
  // SIGNUP
  // -------------------------------
  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert('Signup successful! Check your email.');
  };

  // -------------------------------
  // LOGIN
  // -------------------------------
  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // -------------------------------
  // UI
  // -------------------------------
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

                    <p>
                      <strong>Price:</strong> ₹{room.price}
                    </p>

                    <p>
                      <strong>Capacity:</strong> {room.capacity} Person(s)
                    </p>

                    <button
                      className="book-btn"
                      onClick={() => handleBook(room.id)}
                    >
                      Book Now
                    </button>

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
