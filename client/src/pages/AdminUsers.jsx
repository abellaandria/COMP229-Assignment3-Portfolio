
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/users";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

function readAuth() {
  const token = sessionStorage.getItem("token");
  const savedUser = sessionStorage.getItem("user");

  try {
    return {
      token,
      user: savedUser ? JSON.parse(savedUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

function AdminUsers() {
  const [auth, setAuth] = useState(readAuth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = Boolean(
    auth.token && auth.user?.role === "admin"
  );

  useEffect(() => {
    const updateAuth = () => setAuth(readAuth());

    window.addEventListener("authChanged", updateAuth);

    return () =>
      window.removeEventListener("authChanged", updateAuth);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load users."
          );
        }

        if (!controller.signal.aborted) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [isAdmin, auth.token]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(user) {
    setEditingId(user._id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (!editingId && form.password.length < 12) {
      setError(
        "New user passwords must contain at least 12 characters."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      // Password is required only when creating users.
      if (!isEditing) {
        payload.password = form.password;
      }

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save user."
        );
      }

      if (isEditing) {
        setUsers((previous) =>
          previous.map((user) =>
            user._id === editingId ? data : user
          )
        );

        // Keep session user information synchronized
        if (editingId === auth.user?.id) {
          const updatedSessionUser = {
            ...auth.user,
            name: data.name,
            email: data.email,
          };

          sessionStorage.setItem(
            "user",
            JSON.stringify(updatedSessionUser)
          );
        }

        alert("User updated successfully!");
      } else {
        // POST returns { message, user }
        const newUser = data.user;

        if (newUser) {
          setUsers((previous) => [...previous, newUser]);
        }

        alert("User created successfully!");
      }

      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (deletingId) return;

    if (user.role === "admin") {
      alert("Admin accounts cannot be deleted here.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${user.name}?`
      )
    ) {
      return;
    }

    setDeletingId(user._id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${user._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete user."
        );
      }

      setUsers((previous) =>
        previous.filter(
          (existingUser) => existingUser._id !== user._id
        )
      );

      alert("User deleted successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAdmin) {
    return <Navigate to="/signin" replace />;
  }

  const buttonStyle = {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background:
      "linear-gradient(90deg, #d18eac, #9075bd)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "10px",
    marginTop: "10px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d7c5e8",
    borderRadius: "8px",
    marginTop: "6px",
    marginBottom: "15px",
    boxSizing: "border-box",
  };

  return (
    <main className="education-page">
      <section className="education-section">
        <p className="section-label">
          ADMIN DASHBOARD
        </p>

        <h1>User Management</h1>

        <p className="education-intro">
          View and manage registered users of the
          MERN portfolio application.
        </p>

        <button
          type="button"
          style={buttonStyle}
          onClick={
            showForm ? closeForm : openAddForm
          }
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>

        {error && (
          <p
            role="alert"
            style={{
              color: "crimson",
              marginTop: "15px",
            }}
          >
            {error}
          </p>
        )}

        {showForm && (
          <div
            className="education-card"
            style={{
              maxWidth: "550px",
              marginTop: "25px",
              padding: "25px",
            }}
          >
            <h2>
              {editingId
                ? "Edit User"
                : "Create New User"}
            </h2>

            <form onSubmit={handleSubmit}>
              <label htmlFor="admin-user-name">
                Name
              </label>
              <input
                id="admin-user-name"
                style={inputStyle}
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label htmlFor="admin-user-email">
                Email
              </label>
              <input
                id="admin-user-email"
                style={inputStyle}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              {!editingId && (
                <>
                  <label htmlFor="admin-user-password">
                    Password
                  </label>
                  <input
                    id="admin-user-password"
                    style={inputStyle}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={12}
                    autoComplete="new-password"
                    required
                  />

                  <p>
                    Password must be at least
                    12 characters.
                  </p>
                </>
              )}

              <button
                type="submit"
                style={buttonStyle}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update User"
                    : "Create User"}
              </button>

              <button
                type="button"
                style={{
                  ...buttonStyle,
                  background: "#777",
                }}
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading && (
          <p>Loading registered users...</p>
        )}

        {!loading &&
          !error &&
          users.length === 0 && (
            <p>No registered users found.</p>
          )}

        {!loading && users.length > 0 && (
          <div
            className="education-grid"
            style={{ marginTop: "30px" }}
          >
            {users.map((user) => (
              <div
                className="education-card"
                key={user._id}
              >
                <h2>{user.name}</h2>

                <p>
                  <strong>Email:</strong>{" "}
                  {user.email}
                </p>

                <p>
                  <strong>Role:</strong>{" "}
                  {user.role}
                </p>

                <p
                  style={{
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong>User ID:</strong>{" "}
                  {user._id}
                </p>

                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() =>
                    openEditForm(user)
                  }
                >
                  Edit
                </button>

                {user.role !== "admin" && (
                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      background: "#c85b72",
                    }}
                    onClick={() =>
                      handleDelete(user)
                    }
                    disabled={
                      deletingId === user._id
                    }
                  >
                    {deletingId === user._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminUsers;
