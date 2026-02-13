import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


function App() {
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showBookings, setShowBookings] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);

  const [disabledDates, setDisabledDates] = useState([]);


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
  // FETCH BOOKING
  // -------------------------------
// Fetch user's bookings
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
      id,
      check_in,
      check_out,
      status,
      rooms (
        name,
        price,
        image_url
      )
    `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setBookings(data);
    }
  };
  //----------------------------------------
  // Fetch user role
  //----------------------------------------
  const fetchUserRole = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setUserRole(data.role);
    }
  };

  //-----------------------------------
  // Fetch all bookings (Admin)
  //-----------------------------------
  const fetchAllBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
      id,
      check_in,
      check_out,
      status,
      rooms (
        name,
        price,
        image_url
      )
    `)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setBookings(data);
    }
  };


//-------------------------------------------
// Open booking modal and load booked dates
//-------------------------------------------
  const openBookingModal = async (room) => {
    setSelectedRoom(room);
    setShowModal(true);

    setCheckIn(null);
    setCheckOut(null);

    // Get existing bookings for this room
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('room_id', room.id)
.eq('status', 'approved');

    if (error) {
      alert(error.message);
      return;
    }

    // Generate disabled dates
    let dates = [];

    data.forEach((booking) => {
      let start = new Date(booking.check_in);
      let end = new Date(booking.check_out);

      for (
        let d = new Date(start);
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d));
      }
    });

    setDisabledDates(dates);
  };

  // -------------------------------
  // LOAD ROOMS AFTER LOGIN
  // -------------------------------
  useEffect(() => {
    if (session) {
      fetchRooms();
      fetchUserRole();
    }
  }, [session]);

  useEffect(() => {
    if (!session || !userRole) return;

    const isAdmin = userRole === 'admin' || userRole === 'admin_user';

    if (isAdmin) {
      console.log("ADMIN MODE: Fetching all bookings");
      fetchAllBookings();
    } else {
      console.log("USER MODE: Fetching own bookings");
      fetchBookings();
    }

  }, [session, userRole]);


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
  //---------------------------------
  // Confirm booking from modal
  //---------------------------------
  const handleConfirmBooking = async () => {
    if (!checkIn || !checkOut) {
      alert('Please select both dates');
      return;
    }

    if (checkIn >= checkOut) {
      alert('Check-out must be after check-in');
      return;
    }

    // Extra safety: check conflicts again
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', selectedRoom.id)
      .eq('status', 'approved')
      .lt('check_in', checkOut.toISOString())
      .gt('check_out', checkIn.toISOString());

    if (conflictError) {
      alert(conflictError.message);
      return;
    }

    if (conflicts.length > 0) {
      alert('❌ Selected dates are already booked');
      return;
    }

    // Insert booking
    const { error } = await supabase.from('bookings').insert([
      {
        room_id: selectedRoom.id,
        user_id: session.user.id,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        status: 'pending',
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert('Booking successful 🎉');

      setShowModal(false);

      if (userRole === 'admin') {
        fetchAllBookings();
      } else {
        fetchBookings();
      }

    }
  };
  //-----------------------------------
  // Update booking status (Admin)
  //-----------------------------------
  const updateBookingStatus = async (bookingId, newStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert(error.message);
    } else {
      alert(`Booking ${newStatus}`);
      fetchAllBookings();
      fetchRooms();
    }
  };
  //-----------------------------
  // Status Badge Component
  //-----------------------------
  const StatusBadge = ({ status }) => {
    return (
      <span className={`status-badge ${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
//-----------------------------------------
// Statistics admin dashboard
//-----------------------------------------
  const totalBookings = bookings.length;

  const pendingCount = bookings.filter(
    (b) => b.status === "pending"
  ).length;

  const approvedCount = bookings.filter(
    (b) => b.status === "approved"
  ).length;

  const rejectedCount = bookings.filter(
    (b) => b.status === "rejected"
  ).length;

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
          <div>

            {/* NAVBAR */}
            <div className="navbar">

              {/* Left */}
              <div className="nav-left">
                🏠 RentalHub
              </div>

              {/* Center */}
              <div className="nav-center">
                Welcome, {session.user.email}
              </div>

              {/* Right */}
              <div className="nav-right">

                {/* USER NAV */}
                {userRole !== 'admin' && !showBookings && (
                  <button
                    className="nav-link"
                    onClick={() => setShowBookings(true)}
                  >
                    My Bookings
                  </button>
                )}

                {userRole !== 'admin' && showBookings && (
                  <button
                    className="nav-link"
                    onClick={() => setShowBookings(false)}
                  >
                    Home
                  </button>
                )}

                {/* ADMIN NAV */}
                {userRole === 'admin' && !showBookings && (
                  <button
                    className="nav-link"
                    onClick={() => setShowBookings(true)}
                  >
                    View Bookings
                  </button>
                )}

                {userRole === 'admin' && showBookings && (
                  <button
                    className="nav-link"
                    onClick={() => setShowBookings(false)}
                  >
                    Home
                  </button>
                )}

                <button
                  className="nav-link logout-btn"
                  onClick={logout}
                >
                  Logout
                </button>

              </div>

            </div>

<div className="welcome-container">

{/* MY BOOKINGS */}
{showBookings && userRole !== 'admin' && (
  <>
    <h3>My Bookings</h3>
            {bookings.length === 0 ? (
              <p>You have no bookings yet.</p>
            ) : (
              <div className="bookings-container">
                {bookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <img
                      src={booking.rooms?.image_url}
                      alt={booking.rooms?.name}
                      className="booking-image"
                    />

                    <div className="booking-content">
                      <h4>{booking.rooms?.name}</h4>

                      <p>
                        <strong>Check-in:</strong> {booking.check_in}
                      </p>

                      <p>
                        <strong>Check-out:</strong> {booking.check_out}
                      </p>

                      <p>
                        <strong>Status:</strong> <StatusBadge status={booking.status} />
                      </p>
                      <p>
                        <strong>Price:</strong> ₹{booking.rooms?.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
  </>
)}


{/* ADMIN BOOKINGS */}
{userRole === 'admin' && showBookings && (
  <>
  {/*-----------------------------------------
// Statistics admin dashboard
//-----------------------------------------*/}
                  <div className="stats-container">

                    <div className="stat-card">
                      <h3>{totalBookings}</h3>
                      <p>Total Bookings</p>
                    </div>

                    <div className="stat-card pending">
                      <h3>{pendingCount}</h3>
                      <p>Pending</p>
                    </div>

                    <div className="stat-card approved">
                      <h3>{approvedCount}</h3>
                      <p>Approved</p>
                    </div>

                    <div className="stat-card rejected">
                      <h3>{rejectedCount}</h3>
                      <p>Rejected</p>
                    </div>

              </div>
    <h3>All Bookings (Admin)</h3>

    {bookings.length === 0 ? (
      <p>No bookings found.</p>
    ) : (
      <div className="bookings-container">
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-card">
            <img
              src={booking.rooms?.image_url}
              alt={booking.rooms?.name}
              className="booking-image"
            />

            <div className="booking-content">
              <h4>{booking.rooms?.name}</h4>

              <p><strong>Check-in:</strong> {booking.check_in}</p>
              <p><strong>Check-out:</strong> {booking.check_out}</p>
              <p><strong>Status:</strong> <StatusBadge status={booking.status} /></p>
              <p><strong>Price:</strong> ₹{booking.rooms?.price}</p>

              {booking.status === 'pending' && (
                <div className="admin-actions">
                  <button
                    className="approve-btn"
                    onClick={() =>
                      updateBookingStatus(booking.id, 'approved')
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() =>
                      updateBookingStatus(booking.id, 'rejected')
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}


{/* ROOMS LIST */}
{!showBookings && (
  <>
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
                      onClick={() => openBookingModal(room)}
                    >
                      Book Now
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}
    </>
)}

        </div>
</div>
      )}

      {/* BOOKING MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="booking-modal">

            <h3>Book: {selectedRoom?.name}</h3>

            <div className="date-picker-group">

              <label>Check In</label>
              <DatePicker
                selected={checkIn}
                onChange={(date) => setCheckIn(date)}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                minDate={new Date()}
                excludeDates={disabledDates}
                placeholderText="Select check-in date"
              />

              <label>Check Out</label>
              <DatePicker
                selected={checkOut}
                onChange={(date) => setCheckOut(date)}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn || new Date()}
                excludeDates={disabledDates}
                placeholderText="Select check-out date"
              />

            </div>

            <div className="modal-buttons">
              <button
                className="confirm-btn"
                onClick={handleConfirmBooking}
              >
                Confirm Booking
              </button>

              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
