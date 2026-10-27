
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const navigate = useNavigate();

  // Get the currently signed-in user
  const getSavedUser = () => {
    const token = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    if (!token || !savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  };

  // Store user information in React state
  const [user, setUser] = useState(getSavedUser);

  // Update Navbar when authentication status changes
  useEffect(() => {
    const updateUser = () => {
      setUser(getSavedUser());
    };

    window.addEventListener("authChanged", updateUser);

    return () => {
      window.removeEventListener("authChanged", updateUser);
    };
  }, []);

  // Check if the logged-in user is an Admin
  const isAdmin = user?.role === "admin";

  // Sign Out function
  const handleSignout = () => {
    // Remove JWT token and user information
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // Update React state
    setUser(null);

    // Notify other components about signout
    window.dispatchEvent(new Event("authChanged"));

    // Show successful signout pop-up
    window.alert(
      "Signed Out Successfully!\n\nThank you for visiting!"
    );

    // Redirect to Sign In after clicking OK
    navigate("/signin");
  };

  return (
    <nav>
      {/* Portfolio logo */}
      <div>
        <Link to="/">AA</Link>
      </div>

      {/* Navigation links */}
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About Me</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/education">Education</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact Me</Link>

        {/* Admin-only User Management link */}
        {isAdmin && (
          <Link to="/admin/users">
            Manage Users
          </Link>
        )}

        {/* Authentication navigation */}
        {user ? (
          <button
            type="button"
            onClick={handleSignout}
          >
            Sign Out
          </button>
        ) : (
          <>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
