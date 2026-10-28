
import { useState, useEffect } from "react";

import portfolioImage from "../assets/project-portfolio.jpg";
import photoViewerImage from "../assets/project-photo-viewer.jpg";
import databaseImage from "../assets/project-database.jpg";

// Use Render API in production and localhost in development
const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/projects`;

// Empty form fields
const emptyForm = {
  title: "",
  firstname: "",
  lastname: "",
  email: "",
  completion: "",
  description: ""
};

// Read authentication information
function readAuth() {
  const token = sessionStorage.getItem("token");
  const savedUser = sessionStorage.getItem("user");

  try {
    return {
      token,
      user: savedUser ? JSON.parse(savedUser) : null
    };
  } catch {
    return {
      token: null,
      user: null
    };
  }
}

function Projects() {
  // MongoDB projects
  const [dbProjects, setDbProjects] = useState([]);

  // Authentication information
  const [auth, setAuth] = useState(readAuth);

  // Loading and message states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add/Edit form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Check whether the logged-in user is Admin
  const isAdmin = Boolean(
    auth.token && auth.user?.role === "admin"
  );

  // Update authentication when user signs in or out
  useEffect(() => {
    const updateAuth = () => {
      setAuth(readAuth());
    };

    window.addEventListener("authChanged", updateAuth);

    return () => {
      window.removeEventListener("authChanged", updateAuth);
    };
  }, []);

  // Load projects from MongoDB
  useEffect(() => {
    if (!auth.token) {
      setDbProjects([]);
      setShowForm(false);
      setEditingId(null);
      return;
    }

    const controller = new AbortController();

    const loadProjects = async () => {
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
            data.message || "Unable to load projects."
          );
        }

        if (!controller.signal.aborted) {
          setDbProjects(
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

    loadProjects();

    return () => {
      controller.abort();
    };
  }, [auth.token]);

  // Update form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Open Add Project form
  const handleNewProject = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Open Edit Project form
  const handleEdit = (project) => {
    if (!isAdmin) return;

    setEditingId(project._id);

    setForm({
      title: project.title || "",
      firstname: project.firstname || "",
      lastname: project.lastname || "",
      email: project.email || "",
      completion: project.completion
        ? project.completion.substring(0, 10)
        : "",
      description: project.description || ""
    });

    setShowForm(true);
    setError("");
    setSuccess("");

    // Scroll to the form after React renders it
    setTimeout(() => {
      document
        .getElementById("project-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }, 100);
  };

  // Cancel Add/Edit
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  // Create or Update project
  const handleSaveProject = async (e) => {
    e.preventDefault();

    if (!isAdmin || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(editingId);

    try {
      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          ...form,
          completion: form.completion || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save project."
        );
      }

      if (isEditing) {
        // Update the project in React state
        setDbProjects((previous) =>
          previous.map((project) =>
            project._id === editingId
              ? data
              : project
          )
        );
      } else {
        // Add the new project to React state
        setDbProjects((previous) => [
          ...previous,
          data
        ]);
      }

      // Reset the form
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      const successMessage = isEditing
        ? "Project Updated Successfully!"
        : "Project Added Successfully!";

      setSuccess(successMessage);

      // Display success pop-up
      window.alert(successMessage);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE PROJECT - Admin only
  const handleDelete = async (project) => {
    if (!isAdmin || deletingId) return;

    // Ask for confirmation before deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"?\n\nThis action cannot be undone.`
    );

    // Stop if Admin clicks Cancel
    if (!confirmed) {
      return;
    }

    setDeletingId(project._id);
    setError("");
    setSuccess("");

    try {
      // Send DELETE request to Express API
      const response = await fetch(
        `${API_URL}/${project._id}`,
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
          data.message || "Unable to delete project."
        );
      }

      // Remove deleted project from React state
      setDbProjects((previous) =>
        previous.filter(
          (item) => item._id !== project._id
        )
      );

      // Close the form if this project was being edited
      if (editingId === project._id) {
        setEditingId(null);
        setShowForm(false);
        setForm(emptyForm);
      }

      // Show success message
      setSuccess("Project Deleted Successfully!");

      window.alert("Project Deleted Successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="projects-page">
      <section className="projects-section">

        <p className="section-label">MY WORK</p>

        <h1>My Projects</h1>

        <p className="projects-intro">
          Here are some of the projects I have completed while
          developing my skills in web development, programming,
          and database management.
        </p>

        {/* ORIGINAL PORTFOLIO PROJECTS */}
        <div className="projects-grid">

          {/* Project 1 */}
          <div className="project-card">
            <img
              src={portfolioImage}
              alt="Web development and programming"
              className="project-image"
            />

            <div className="project-number">01</div>

            <h2>Personal Portfolio Website</h2>

            <p>
              I designed and developed a personal portfolio
              website using React to showcase my skills,
              education, services, and projects.
            </p>

            <div className="project-details">
              <p>
                <strong>Role:</strong> Web Developer and Designer
              </p>

              <p>
                <strong>Outcome:</strong> Created a responsive
                portfolio website that presents my professional
                and technical experience.
              </p>
            </div>

            <div className="project-tech">
              <span>React</span>
              <span>JavaScript</span>
              <span>CSS</span>
            </div>
          </div>

          {/* Project 2 */}
          <div className="project-card">
            <img
              src={photoViewerImage}
              alt="Photo gallery"
              className="project-image"
            />

            <div className="project-number">02</div>

            <h2>Photo Viewer Application</h2>

            <p>
              I developed an interactive photo viewer that
              allows users to view images, enlarge photos,
              use a slideshow, and manage favorite images.
            </p>

            <div className="project-details">
              <p>
                <strong>Role:</strong> Front-End Developer
              </p>

              <p>
                <strong>Outcome:</strong> Created an interactive
                web application using HTML, CSS, and JavaScript.
              </p>
            </div>

            <div className="project-tech">
              <span>HTML</span>
              <span>CSS</span>
              <span>JavaScript</span>
            </div>
          </div>

          {/* Project 3 */}
          <div className="project-card">
            <img
              src={databaseImage}
              alt="Database and technology"
              className="project-image"
            />

            <div className="project-number">03</div>

            <h2>Database Management Project</h2>

            <p>
              I created and managed a relational database
              using Oracle SQL, including tables,
              relationships, constraints, and SQL queries.
            </p>

            <div className="project-details">
              <p>
                <strong>Role:</strong> Database Developer
              </p>

              <p>
                <strong>Outcome:</strong> Developed a structured
                database and used SQL queries to retrieve
                and manage information.
              </p>
            </div>

            <div className="project-tech">
              <span>Oracle SQL</span>
              <span>Database</span>
              <span>SQL</span>
            </div>
          </div>

        </div>

        {/* MONGODB PROJECTS SECTION */}
        {auth.token && (
          <div style={{ marginTop: "50px" }}>

            <p className="section-label">
              DATABASE PROJECTS
            </p>

            <h2>Projects from MongoDB</h2>

            {/* Admin Add Project button */}
            {isAdmin && (
              <button
                type="button"
                onClick={
                  showForm
                    ? handleCancel
                    : handleNewProject
                }
              >
                {showForm ? "Cancel" : "+ Add Project"}
              </button>
            )}

            {/* ADMIN ADD / EDIT FORM */}
            {isAdmin && showForm && (
              <div
                id="project-form"
                className="signin-container"
              >
                <h2>
                  {editingId
                    ? "Edit Project"
                    : "Add New Project"}
                </h2>

                <form onSubmit={handleSaveProject}>

                  <div>
                    <label htmlFor="project-title">
                      Project Title
                    </label>
                    <input
                      id="project-title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="project-firstname">
                      First Name
                    </label>
                    <input
                      id="project-firstname"
                      name="firstname"
                      value={form.firstname}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="project-lastname">
                      Last Name
                    </label>
                    <input
                      id="project-lastname"
                      name="lastname"
                      value={form.lastname}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="project-email">
                      Email
                    </label>
                    <input
                      id="project-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="project-completion">
                      Completion Date (Optional)
                    </label>
                    <input
                      id="project-completion"
                      name="completion"
                      type="date"
                      value={form.completion}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="project-description">
                      Description
                    </label>
                    <textarea
                      id="project-description"
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
                        ? "Update Project"
                        : "Save Project"}
                  </button>

                </form>
              </div>
            )}

            {/* Messages */}
            {loading && <p>Loading projects...</p>}

            {error && (
              <p role="alert">{error}</p>
            )}

            {success && (
              <p role="status">{success}</p>
            )}

            {!loading &&
              !error &&
              dbProjects.length === 0 && (
                <p>
                  No projects have been saved in MongoDB yet.
                </p>
              )}

            {/* MONGODB PROJECT CARDS */}
            {!loading &&
              dbProjects.length > 0 && (
                <div className="projects-grid">

                  {dbProjects.map((project, index) => (
                    <div
                      className="project-card"
                      key={project._id}
                    >
                      <div className="project-number">
                        {String(index + 4).padStart(2, "0")}
                      </div>

                      <h2>{project.title}</h2>

                      <p>{project.description}</p>

                      <div className="project-details">
                        <p>
                          <strong>Completion:</strong>{" "}
                          {project.completion
                            ? new Date(
                                project.completion
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>

                      {/* ADMIN EDIT AND DELETE BUTTONS */}
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
                            onClick={() =>
                              handleEdit(project)
                            }
                            disabled={Boolean(deletingId)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(project)
                            }
                            disabled={Boolean(deletingId)}
                            style={{
                              backgroundColor: "#B84A62",
                              color: "#FFFFFF"
                            }}
                          >
                            {deletingId === project._id
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

        {/* IMAGE CREDITS */}
        <div className="image-credits">
          <p>
            <strong>Image Credits:</strong> Project images
            are used for educational portfolio purposes.
            Image sources and photographer credits are
            acknowledged where applicable.
          </p>
        </div>

      </section>
    </main>
  );
}

export default Projects;
