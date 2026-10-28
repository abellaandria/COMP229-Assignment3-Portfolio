
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/contacts`;

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

function Contact() {
  const navigate = useNavigate();

  // Original public contact form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Admin contact management
  const [auth, setAuth] = useState(readAuth);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    contactNumber: "",
    email: "",
    message: "",
  });

  const isAdmin = Boolean(
    auth.token && auth.user?.role === "admin"
  );

  // Detect Sign In and Sign Out
  useEffect(() => {
    const updateAuth = () => setAuth(readAuth());

    window.addEventListener("authChanged", updateAuth);

    return () => {
      window.removeEventListener("authChanged", updateAuth);
    };
  }, []);

  // Load submitted contacts for Admin only
  useEffect(() => {
    if (!isAdmin) {
      setContacts([]);
      setEditingId(null);
      setAdminError("");
      return;
    }

    const controller = new AbortController();

    const loadContacts = async () => {
      setLoading(true);
      setAdminError("");

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
            data.message || "Unable to load contacts."
          );
        }

        if (!controller.signal.aborted) {
          setContacts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAdminError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadContacts();

    return () => controller.abort();
  }, [isAdmin, auth.token]);

  // Original public form input
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Submit visitor message to MongoDB
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: formData.firstName,
          lastname: formData.lastName,
          contactNumber: formData.contactNumber,
          email: formData.email,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save contact information."
        );
      }

      navigate("/", {
        state: {
          message:
            "Thank you for reaching out! Your message has been submitted successfully.",
        },
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Admin Edit form
  const handleEdit = (contact) => {
    if (!isAdmin) return;

    setEditingId(contact._id);
    setAdminError("");

    setEditForm({
      firstname: contact.firstname || "",
      lastname: contact.lastname || "",
      contactNumber: contact.contactNumber || "",
      email: contact.email || "",
      message: contact.message || "",
    });
  };

  // Update Admin Edit form fields
  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save edited contact
  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!isAdmin || !editingId || saving) return;

    setSaving(true);
    setAdminError("");

    try {
      const response = await fetch(
        `${API_URL}/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update contact."
        );
      }

      setContacts((previous) =>
        previous.map((contact) =>
          contact._id === editingId ? data : contact
        )
      );

      setEditingId(null);
      window.alert("Contact Updated Successfully!");
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete a contact - Admin only
  const handleDelete = async (contact) => {
    if (!isAdmin || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the message from ${contact.firstname} ${contact.lastname}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(contact._id);
    setAdminError("");

    try {
      const response = await fetch(
        `${API_URL}/${contact._id}`,
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
          data.message || "Unable to delete contact."
        );
      }

      setContacts((previous) =>
        previous.filter(
          (item) => item._id !== contact._id
        )
      );

      if (editingId === contact._id) {
        setEditingId(null);
      }

      window.alert("Contact Deleted Successfully!");
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="contact-page">
      <section className="contact-section">

        <p className="section-label">GET IN TOUCH</p>
        <h1>Contact Me</h1>

        <p className="contact-intro">
          Have a question or want to learn more about my skills and projects?
          Feel free to send me a message.
        </p>

        <div className="contact-content">

          {/* Original Contact Information */}
          <div className="contact-info">
            <h2>Let's Connect</h2>

            <p>
              I would be happy to connect with you regarding my projects,
              skills, education, or professional experience.
            </p>

            <div className="contact-detail">
              <h3>Email</h3>
              <p>abellaandria@gmail.com</p>
            </div>

            <div className="contact-detail">
              <h3>Phone</h3>
              <p>647-778-1196</p>
            </div>

            <div className="contact-detail">
              <h3>Location</h3>
              <p>Ontario, Canada</p>
            </div>
          </div>

          {/* Original Public Contact Form */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <h2>Send Me a Message</h2>

            <div className="form-row">
              <div>
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactNumber">
                Contact Number
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            {errorMessage && (
              <p role="alert" style={{ color: "crimson" }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Admin-only Contact Management */}
        {isAdmin && (
          <div style={{ marginTop: "50px" }}>
            <p className="section-label">
              ADMIN CONTACT MANAGEMENT
            </p>

            <h2>Submitted Contact Messages</h2>

            {loading && <p>Loading contacts...</p>}

            {adminError && (
              <p role="alert" style={{ color: "crimson" }}>
                {adminError}
              </p>
            )}

            {!loading &&
              !adminError &&
              contacts.length === 0 && (
                <p>No contact messages found.</p>
              )}

            {!loading && contacts.length > 0 && (
              <div className="education-grid">
                {contacts.map((contact) => (
                  <div
                    className="education-card"
                    key={contact._id}
                  >
                    <h2>
                      {contact.firstname} {contact.lastname}
                    </h2>

                    <p>
                      <strong>Email:</strong>{" "}
                      {contact.email}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {contact.contactNumber || "Not provided"}
                    </p>

                    <p>
                      <strong>Message:</strong>{" "}
                      {contact.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "15px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(contact)}
                        disabled={Boolean(deletingId)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(contact)}
                        disabled={Boolean(deletingId)}
                        style={{
                          backgroundColor: "#B84A62",
                          color: "#FFFFFF",
                        }}
                      >
                        {deletingId === contact._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>

                    {/* Edit form for selected contact */}
                    {editingId === contact._id && (
                      <form
                        onSubmit={handleSaveEdit}
                        style={{ marginTop: "20px" }}
                      >
                        <h3>Edit Contact</h3>

                        <label>First Name</label>
                        <input
                          name="firstname"
                          value={editForm.firstname}
                          onChange={handleEditChange}
                          required
                        />

                        <label>Last Name</label>
                        <input
                          name="lastname"
                          value={editForm.lastname}
                          onChange={handleEditChange}
                          required
                        />

                        <label>Contact Number</label>
                        <input
                          name="contactNumber"
                          value={editForm.contactNumber}
                          onChange={handleEditChange}
                        />

                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                          required
                        />

                        <label>Message</label>
                        <textarea
                          name="message"
                          value={editForm.message}
                          onChange={handleEditChange}
                          rows={4}
                          required
                        />

                        <button
                          type="submit"
                          disabled={saving}
                        >
                          {saving
                            ? "Saving..."
                            : "Update Contact"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={saving}
                          style={{ marginLeft: "10px" }}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>
    </main>
  );
}

export default Contact;
