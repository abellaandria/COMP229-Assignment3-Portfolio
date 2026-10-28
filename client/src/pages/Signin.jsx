
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Use the deployed API when configured, otherwise use localhost
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      // Display an error if the login fails
      if (!response.ok) {
        setMessage(data.message || "Sign in failed.");
        return;
      }

      // Save authentication details for this browser tab
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Notify Navbar that the user has signed in
      window.dispatchEvent(new Event("authChanged"));

      // Show a success pop-up
      window.alert(
        `Login Successful!\n\nWelcome back, ${data.user.name}!`
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
      <h2>Sign In</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Display error messages */}
      {message && <p role="alert">{message}</p>}
    </div>
  );
}

export default Signin;
