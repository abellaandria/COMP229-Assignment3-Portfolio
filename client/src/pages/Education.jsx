
import { useState, useEffect } from "react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/qualifications`;

const emptyForm = {
  title: "",
  firstname: "",
  lastname: "",
  email: "",
  completion: "",
  description: ""
};

// Get saved authentication details
function readAuth() {
  const token = sessionStorage.getItem("token");
  const savedUser = sessionStorage.getItem("user");

  try {
    return {
      token,
      user: savedUser ? JSON.parse(savedUser) : null
    };
  } catch {
    return { token: null, user: null };
  }
}

function Education() {
  const [auth, setAuth] = useState(readAuth);
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = Boolean(
    auth.token && auth.user?.role === "admin"
  );

  // Update authentication when login status changes
  useEffect(() => {
    const updateAuth = () => setAuth(readAuth());

    window.addEventListener("authChanged", updateAuth);

    return () => {
      window.removeEventListener("authChanged", updateAuth);
    };
  }, []);

  // Load qualifications from MongoDB
  useEffect(() => {
    if (!auth.token) {
      setQualifications([]);
      setShowForm(false);
      setEditingId(null);
      return;
    }

    const controller = new AbortController();

    const loadQualifications = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          },
          signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load qualifications."
          );
        }

        if (!controller.signal.aborted) {
          setQualifications(
            Array.isArray(data) ? data : []
          );
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
    };

    loadQualifications();

    return () => controller.abort();
  }, [auth.token]);

  // Update form values
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Open Add Qualification form
  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Open Edit Qualification form
  const handleEdit = (qualification) => {
    if (!isAdmin) return;

    setEditingId(qualification._id);

    setForm({
      title: qualification.title || "",
      firstname: qualification.firstname || "",
      lastname: qualification.lastname || "",
      email: qualification.email || "",
      completion: qualification.completion
        ? qualification.completion.substring(0, 10)
        : "",
      description: qualification.description || ""
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Close form
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // Add or update a qualification
  const handleSave = async (e) => {
    e.preventDefault();

    if (!isAdmin || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(editingId);

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            ...form,
            completion: form.completion || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save qualification."
        );
      }

      if (isEditing) {
        setQualifications((previous) =>
          previous.map((item) =>
            item._id === editingId ? data : item
          )
        );
      } else {
        setQualifications((previous) => [
          ...previous,
          data
        ]);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      const message = isEditing
        ? "Qualification Updated Successfully!"
        : "Qualification Added Successfully!";

      setSuccess(message);
      window.alert(message);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete qualification - Admin only
  const handleDelete = async (qualification) => {
    if (!isAdmin || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${qualification.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(qualification._id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${qualification._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete qualification."
        );
      }

      setQualifications((previous) =>
        previous.filter(
          (item) => item._id !== qualification._id
        )
      );

      if (editingId === qualification._id) {
        setEditingId(null);
        setShowForm(false);
        setForm(emptyForm);
      }

      setSuccess("Qualification Deleted Successfully!");
      window.alert("Qualification Deleted Successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="education-page">
      <section className="education-section">

        <p className="section-label">MY ACADEMIC JOURNEY</p>
        <h1>Education</h1>

        <p className="education-intro">
          My educational background combines my previous studies in
          agribusiness with my current journey into software engineering
          and technology.
        </p>

        {/* Original education cards */}
        <div className="education-grid">

          {/* Centennial College */}
          <div className="education-card">
            <div className="education-year">2026 - Present</div>

            <h2>Software Engineering Technician</h2>
            <h3>Centennial College</h3>

            <div className="education-details">
              <p>
                <strong>Program:</strong> Software Engineering Technician
              </p>

              <p>
                <strong>Started:</strong> January 2026
              </p>

              <p>
                <strong>Status:</strong> Currently Studying
              </p>
            </div>

            <p>
              I am currently studying Software Engineering Technician at
              Centennial College, where I am developing skills in programming,
              web development, databases, software development, and other
              computer technologies.
            </p>

            <div className="education-skills">
              <span>Programming</span>
              <span>Web Development</span>
              <span>Databases</span>
              <span>Software Development</span>
            </div>
          </div>

          {/* Central Luzon State University */}
          <div className="education-card">
            <div className="education-year">2014 - 2017</div>

            <h2>Bachelor of Science in Agribusiness</h2>
            <h3>Central Luzon State University</h3>

            <div className="education-details">
              <p>
                <strong>Location:</strong> Philippines
              </p>

              <p>
                <strong>Started:</strong> June 2014
              </p>

              <p>
                <strong>Status:</strong> Graduated in 2017
              </p>
            </div>

            <p>
              I graduated with a Bachelor of Science in Agribusiness from
              Central Luzon State University in 2017. My education provided
              me with a strong foundation in business, sales, marketing,
              and agribusiness management.
            </p>

            <div className="education-skills">
              <span>Agribusiness</span>
              <span>Business</span>
              <span>Sales</span>
              <span>Marketing</span>
            </div>
          </div>

        </div>

        {/* MongoDB Qualifications */}
        {auth.token && (
          <div style={{ marginTop: "50px" }}>
            <p className="section-label">
              DATABASE QUALIFICATIONS
            </p>

            <h2>Qualifications from MongoDB</h2>

            {/* Admin-only Add button */}
            {isAdmin && (
              <button
                type="button"
                onClick={
                  showForm ? handleCancel : handleNew
                }
              >
                {showForm ? "Cancel" : "+ Add Qualification"}
              </button>
            )}

            {/* Admin Add/Edit form */}
            {isAdmin && showForm && (
              <div className="signin-container">
                <h2>
                  {editingId
                    ? "Edit Qualification"
                    : "Add New Qualification"}
                </h2>

                <form onSubmit={handleSave}>
                  <div>
                    <label htmlFor="qualification-title">
                      Qualification Title
                    </label>
                    <input
                      id="qualification-title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="qualification-firstname">
                      First Name
                    </label>
                    <input
                      id="qualification-firstname"
                      name="firstname"
                      value={form.firstname}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="qualification-lastname">
                      Last Name
                    </label>
                    <input
                      id="qualification-lastname"
                      name="lastname"
                      value={form.lastname}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="qualification-email">
                      Email
                    </label>
                    <input
                      id="qualification-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="qualification-completion">
                      Completion Date (Optional)
                    </label>
                    <input
                      id="qualification-completion"
                      name="completion"
                      type="date"
                      value={form.completion}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="qualification-description">
                      Description
                    </label>
                    <textarea
                      id="qualification-description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Qualification"
                        : "Save Qualification"}
                  </button>
                </form>
              </div>
            )}

            {loading && <p>Loading qualifications...</p>}

            {error && <p role="alert">{error}</p>}

            {success && <p role="status">{success}</p>}

            {!loading &&
              !error &&
              qualifications.length === 0 && (
                <p>
                  No qualifications have been saved in MongoDB yet.
                </p>
              )}

            {!loading && qualifications.length > 0 && (
              <div className="education-grid">
                {qualifications.map((qualification) => (
                  <div
                    className="education-card"
                    key={qualification._id}
                  >
                    <div className="education-year">
                      {qualification.completion
                        ? new Date(
                            qualification.completion
                          ).getUTCFullYear()
                        : "In Progress"}
                    </div>

                    <h2>{qualification.title}</h2>

                    <p>{qualification.description}</p>

                    <div className="education-details">
                      <p>
                        <strong>Completion:</strong>{" "}
                        {qualification.completion
                          ? qualification.completion.substring(0, 10)
                          : "Not specified"}
                      </p>
                    </div>

                    {/* Admin-only Edit/Delete buttons */}
                    {isAdmin && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "15px"
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEdit(qualification)}
                          disabled={Boolean(deletingId)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(qualification)}
                          disabled={Boolean(deletingId)}
                          style={{
                            backgroundColor: "#B84A62",
                            color: "#FFFFFF"
                          }}
                        >
                          {deletingId === qualification._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
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

export default Education;
