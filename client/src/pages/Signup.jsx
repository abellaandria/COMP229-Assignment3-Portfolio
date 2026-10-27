
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Check if passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // Require a password with at least 12 characters
    if (password.length < 12) {
      setMessage("Password must contain at least 12 characters.");
      return;
    }

    setLoading(true);

    try {
      // Send signup information to Express backend
      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      const data = await response.json();

      // Display registration errors
      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      // Save JWT token and registered user
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Notify Navbar that the user has signed up
      window.dispatchEvent(new Event("authChanged"));

      // Show successful signup pop-up
      window.alert(
        `Account Created Successfully!\n\nWelcome, ${data.user.name}!`
      );

      // Redirect to Home after clicking OK
      navigate("/");

    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div>
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            required
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="signup-confirm">
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Display error messages */}
      {message && <p role="alert">{message}</p>}

      {/* Link to Sign In */}
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Already have an account?{" "}
        <Link to="/signin">Sign In</Link>
      </p>
    </div>
  );
}

export default Signup;
