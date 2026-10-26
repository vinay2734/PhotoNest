import { useEffect, useState } from "react";
import "./App.css";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";

const API_URL = "http://localhost:5000/api/photos";
const DELETED_KEY = "photonest_deleted_sample_photos";
const EDITED_KEY = "photonest_edited_sample_photos";

const samplePhotos = [
  { id: "sample-1", title: "Mountain Lake", category: "Nature", description: "A beautiful lake surrounded by majestic mountains.", url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200" },
  { id: "sample-2", title: "Desert Road", category: "Travel", description: "A scenic road passing through a beautiful desert.", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200" },
  { id: "sample-3", title: "Ocean Waves", category: "Ocean", description: "Beautiful blue ocean waves and peaceful water.", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200" },
  { id: "sample-4", title: "Mountain Landscape", category: "Nature", description: "A peaceful mountain landscape.", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200" },
  { id: "sample-5", title: "Green Forest", category: "Nature", description: "A beautiful green forest filled with trees.", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200" },
  { id: "sample-6", title: "Beautiful Sunset", category: "Nature", description: "A stunning sunset over the landscape.", url: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200" },
  { id: "sample-7", title: "Tropical Beach", category: "Travel", description: "A tropical beach with crystal-clear blue water.", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200" },
  { id: "sample-8", title: "Snowy Mountains", category: "Nature", description: "Snow-covered mountains under the night sky.", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200" },
  { id: "sample-9", title: "City Architecture", category: "Architecture", description: "Beautiful modern city architecture.", url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200" },
  { id: "sample-10", title: "Modern Building", category: "Architecture", description: "A modern building with beautiful design.", url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200" },
  { id: "sample-11", title: "Starry Night", category: "Space", description: "A beautiful night sky filled with stars.", url: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1200" },
  { id: "sample-12", title: "Cute Cat", category: "Animals", description: "A cute cat captured in a beautiful photograph.", url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200" },
  { id: "sample-13", title: "Nature Landscape", category: "Nature", description: "A peaceful natural landscape.", url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200" },
  { id: "sample-14", title: "Forest Path", category: "Nature", description: "A peaceful path through a green forest.", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200" },
  { id: "sample-15", title: "Mountain Adventure", category: "Travel", description: "A dramatic mountain landscape for adventure lovers.", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200" },
];

const emptyForm = {
  title: "",
  imageUrl: "",
  category: "",
  description: "",
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getSamplePhotos() {
  const deleted = readStorage(DELETED_KEY, []);
  const edited = readStorage(EDITED_KEY, {});

  return samplePhotos
    .filter((photo) => !deleted.includes(photo.id))
    .map((photo) => ({ ...photo, ...(edited[photo.id] || {}) }));
}

function getPhotoId(photo) {
  return photo?._id || photo?.id || "";
}

function getPhotoUrl(photo) {
  return photo?.url || photo?.imageUrl || "";
}

async function getAuthHeaders(json = true) {
  if (!auth.currentUser) {
    throw new Error("Please log in before managing photos.");
  }

  const token = await auth.currentUser.getIdToken();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

function isValidWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function PhotoImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`image-fallback ${className}`}>
        <span>▧</span>
        <p>Image unavailable</p>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt || "Photo"}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const [photos, setPhotos] = useState(getSamplePhotos);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditManager, setShowEditManager] = useState(false);
  const [photoForm, setPhotoForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingPhotoId, setEditingPhotoId] = useState(null);

  const [savingPhoto, setSavingPhoto] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoMessageType, setPhotoMessageType] = useState("success");

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setCurrentUser(user));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPhotos() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load database photos.");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid photo API response.");

        if (!cancelled) setPhotos([...getSamplePhotos(), ...data]);
      } catch (error) {
        console.error("Photo loading error:", error);
        if (!cancelled) setPhotos(getSamplePhotos());
      }
    }

    fetchPhotos();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...new Set(photos.map((photo) => photo.category).filter(Boolean)),
  ];

  const filteredPhotos = photos.filter((photo) => {
    const searchable = `${photo.title || ""} ${photo.category || ""} ${
      photo.description || ""
    }`.toLowerCase();

    return (
      searchable.includes(search.trim().toLowerCase()) &&
      (selectedCategory === "All" ||
        (photo.category || "").toLowerCase() ===
          selectedCategory.toLowerCase())
    );
  });

  function showPhotoMessage(message, type = "success") {
    setPhotoMessage(message);
    setPhotoMessageType(type);
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setAuthMessage("");

    const form = event.currentTarget;
    const name = form.elements.name?.value.trim() || "";
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    try {
      if (isSignup) {
        if (!name) throw new Error("Please enter your name.");

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, { displayName: name });
        setCurrentUser(result.user);
        setAuthMessage("Account created successfully!");
      } else {
        const result = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        setCurrentUser(result.user);
        setAuthMessage("Login successful!");
      }

      setShowLogin(false);
    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/operation-not-allowed":
          "Enable Email/Password in Firebase Console.",
        "auth/network-request-failed":
          "Network error. Check your internet connection.",
      };

      setAuthMessage(messages[error.code] || error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setShowAddForm(false);
      setShowEditManager(false);
      setEditingPhotoId(null);
      showPhotoMessage("Logged out successfully.");
    } catch {
      showPhotoMessage("Logout failed.", "error");
    }
  }

  async function handleAddPhoto(event) {
    event.preventDefault();
    if (savingPhoto) return;

    if (!currentUser) {
      showPhotoMessage("Please log in before adding a photo.", "error");
      return;
    }

    const title = photoForm.title.trim();
    const imageUrl = photoForm.imageUrl.trim();

    if (!title || title.length > 150) {
      showPhotoMessage(
        !title ? "Please enter a photo title." : "Title cannot exceed 150 characters.",
        "error"
      );
      return;
    }

    if (!isValidWebUrl(imageUrl)) {
      showPhotoMessage("Please enter a valid HTTP or HTTPS image URL.", "error");
      return;
    }

    setSavingPhoto(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          title,
          imageUrl,
          category: photoForm.category.trim() || "Other",
          description: photoForm.description.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not add photo.");

      const newPhoto = result.photo || result;
      setPhotos((previous) => [...previous, newPhoto]);
      setPhotoForm(emptyForm);
      setShowAddForm(false);
      showPhotoMessage("Photo added successfully!");
    } catch (error) {
      console.error("Add photo error:", error);
      showPhotoMessage(error.message || "Could not add photo.", "error");
    } finally {
      setSavingPhoto(false);
    }
  }

  function startEditingPhoto(photo) {
    const id = getPhotoId(photo);

    if (!id) {
      showPhotoMessage("This photo cannot be identified for editing.", "error");
      return;
    }

    setEditingPhotoId(id);
    setEditForm({
      title: photo.title || "",
      imageUrl: getPhotoUrl(photo),
      category: photo.category || "",
      description: photo.description || "",
    });
    setShowAddForm(false);
    setShowEditManager(true);
    setPhotoMessage("");
  }

  function cancelEditing() {
    setEditingPhotoId(null);
    setEditForm(emptyForm);
  }

  async function handleUpdatePhoto(event) {
    event.preventDefault();
    if (updatingPhoto || !editingPhotoId) return;

    const title = editForm.title.trim();
    const imageUrl = editForm.imageUrl.trim();

    if (!title || title.length > 150) {
      showPhotoMessage(
        !title ? "Please enter a photo title." : "Title cannot exceed 150 characters.",
        "error"
      );
      return;
    }

    if (!isValidWebUrl(imageUrl)) {
      showPhotoMessage("Please enter a valid HTTP or HTTPS image URL.", "error");
      return;
    }

    setUpdatingPhoto(true);

    try {
      let updatedPhoto;

      if (String(editingPhotoId).startsWith("sample-")) {
        const editedSamples = readStorage(EDITED_KEY, {});
        const existing = photos.find(
          (photo) => getPhotoId(photo) === editingPhotoId
        );

        updatedPhoto = {
          ...existing,
          title,
          url: imageUrl,
          imageUrl,
          category: editForm.category.trim() || "Other",
          description: editForm.description.trim(),
        };

        localStorage.setItem(
          EDITED_KEY,
          JSON.stringify({ ...editedSamples, [editingPhotoId]: updatedPhoto })
        );
      } else {
        const response = await fetch(`${API_URL}/${editingPhotoId}`, {
          method: "PUT",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            title,
            imageUrl,
            category: editForm.category.trim() || "Other",
            description: editForm.description.trim(),
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not update photo.");

        updatedPhoto = result.photo || result;
      }

      setPhotos((previous) =>
        previous.map((photo) =>
          getPhotoId(photo) === editingPhotoId ? updatedPhoto : photo
        )
      );

      setSelectedPhoto((previous) =>
        getPhotoId(previous) === editingPhotoId ? updatedPhoto : previous
      );

      cancelEditing();
      showPhotoMessage(
        String(editingPhotoId).startsWith("sample-")
          ? "Sample photo updated in this browser."
          : "Database photo updated successfully!"
      );
    } catch (error) {
      console.error("Update photo error:", error);
      showPhotoMessage(error.message || "Could not update photo.", "error");
    } finally {
      setUpdatingPhoto(false);
    }
  }

  async function handleDeletePhoto(photo) {
    const id = getPhotoId(photo);
    if (!id) {
      showPhotoMessage("This photo does not have a valid ID.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${photo.title || "this photo"}"?`)) {
      return;
    }

    setDeletingPhotoId(id);

    try {
      if (String(id).startsWith("sample-")) {
        const deleted = readStorage(DELETED_KEY, []);
        if (!deleted.includes(id)) {
          localStorage.setItem(DELETED_KEY, JSON.stringify([...deleted, id]));
        }

        const edited = readStorage(EDITED_KEY, {});
        delete edited[id];
        localStorage.setItem(EDITED_KEY, JSON.stringify(edited));
      } else {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: await getAuthHeaders(false),
        });

        let result = {};
        try {
          result = await response.json();
        } catch {
          // The server may return an empty response.
        }

        if (!response.ok) {
          throw new Error(result.message || "Could not delete database photo.");
        }
      }

      setPhotos((previous) =>
        previous.filter((item) => getPhotoId(item) !== id)
      );

      if (editingPhotoId === id) cancelEditing();
      if (getPhotoId(selectedPhoto) === id) setSelectedPhoto(null);

      showPhotoMessage("Photo deleted successfully!");
    } catch (error) {
      console.error("Delete photo error:", error);
      showPhotoMessage(error.message || "Could not delete photo.", "error");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handleDownload(photo) {
    const imageUrl = getPhotoUrl(photo);
    if (!imageUrl) {
      window.alert("Image URL is not available.");
      return;
    }

    let objectUrl;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Download failed.");

      objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${(photo.title || "photonest-photo").replace(
        /[^a-z0-9]/gi,
        "-"
      )}.jpg`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
      window.open(imageUrl, "_blank", "noopener,noreferrer");
      window.alert("Direct download unavailable. Save the image from the opened tab.");
    } finally {
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
        setShowLogin(false);
        setShowAddForm(false);
        if (!updatingPhoto) cancelEditing();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updatingPhoto]);

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">Photo<span>nest</span></a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <span className="user-greeting">
                Hi, {currentUser.displayName || currentUser.email}
              </span>
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => {
                  setIsSignup(false);
                  setAuthMessage("");
                  setShowLogin(true);
                }}
              >
                Login
              </button>
              <button
                className="signup-btn"
                onClick={() => {
                  setIsSignup(true);
                  setAuthMessage("");
                  setShowLogin(true);
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <p className="tagline">DISCOVER YOUR NEXT INSPIRATION</p>
          <h1>Every picture tells<br />a beautiful <span>story.</span></h1>
          <p className="description">
            Explore beautiful photographs and find inspiration.
          </p>

          <form className="search-box" onSubmit={(event) => event.preventDefault()}>
            <input
              type="search"
              placeholder="Search nature, travel, ocean, cat..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          <p className="popular">
            Popular:{" "}
            {["Nature", "Travel", "Architecture", "Ocean", "Animals"].map(
              (category, index) => (
                <span key={category}>
                  <button
                    type="button"
                    className="popular-link"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory(category);
                    }}
                  >
                    {category}
                  </button>
                  {index < 4 ? " · " : ""}
                </span>
              )
            )}
          </p>
        </section>

        <section className="gallery-section" id="explore">
          <div className="section-heading">
            <div>
              <p className="tagline">EXPLORE THE COLLECTION</p>
              <h2>Discover beautiful photos</h2>
              <p>Find inspiration in every frame.</p>
            </div>

            {currentUser && (
              <div className="gallery-controls">
                <button
                  className="signup-btn"
                  onClick={() => {
                    setShowAddForm((previous) => !previous);
                    setShowEditManager(false);
                    cancelEditing();
                    setPhotoMessage("");
                  }}
                >
                  {showAddForm ? "Close Add Form" : "+ Add Photo"}
                </button>

                <button
                  className="manage-btn"
                  onClick={() => {
                    setShowEditManager((previous) => !previous);
                    setShowAddForm(false);
                    cancelEditing();
                    setPhotoMessage("");
                  }}
                >
                  {showEditManager ? "Close Photo Manager" : "Edit Photos"}
                </button>
              </div>
            )}
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "category-btn active" : "category-btn"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {photoMessage && (
            <p className={`photo-message ${photoMessageType}`} role="status">
              {photoMessage}
            </p>
          )}

          {showAddForm && (
            <form className="photo-form" onSubmit={handleAddPhoto}>
              <h3>Add a new photo</h3>

              <label htmlFor="add-title">Photo title</label>
              <input
                id="add-title"
                maxLength={150}
                required
                value={photoForm.title}
                onChange={(event) => setPhotoForm({ ...photoForm, title: event.target.value })}
                placeholder="Enter photo title"
              />

              <label htmlFor="add-url">Image URL</label>
              <input
                id="add-url"
                type="url"
                required
                value={photoForm.imageUrl}
                onChange={(event) => setPhotoForm({ ...photoForm, imageUrl: event.target.value })}
                placeholder="https://example.com/image.jpg"
              />

              <label htmlFor="add-category">Category</label>
              <input
                id="add-category"
                value={photoForm.category}
                onChange={(event) => setPhotoForm({ ...photoForm, category: event.target.value })}
                placeholder="Nature, Travel, Animals..."
              />

              <label htmlFor="add-description">Description</label>
              <textarea
                id="add-description"
                rows={3}
                value={photoForm.description}
                onChange={(event) => setPhotoForm({ ...photoForm, description: event.target.value })}
                placeholder="Describe this photo"
              />

              <div className="form-actions">
                <button className="signup-btn" type="submit" disabled={savingPhoto}>
                  {savingPhoto ? "Saving..." : "Save Photo"}
                </button>
                <button
                  className="login-btn"
                  type="button"
                  disabled={savingPhoto}
                  onClick={() => {
                    setShowAddForm(false);
                    setPhotoForm(emptyForm);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showEditManager && (
            <section className="manager-panel">
              <div className="manager-heading">
                <div>
                  <h3>Photo Manager</h3>
                  <p>Select a photo to edit or delete it.</p>
                </div>
                <span className="manager-count">{photos.length} photos</span>
              </div>

              {editingPhotoId && (
                <form className="photo-form edit-form" onSubmit={handleUpdatePhoto}>
                  <h3>Edit photo details</h3>

                  <label htmlFor="edit-title">Photo title</label>
                  <input
                    id="edit-title"
                    maxLength={150}
                    required
                    value={editForm.title}
                    onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                  />

                  <label htmlFor="edit-url">Image URL</label>
                  <input
                    id="edit-url"
                    type="url"
                    required
                    value={editForm.imageUrl}
                    onChange={(event) => setEditForm({ ...editForm, imageUrl: event.target.value })}
                  />

                  <label htmlFor="edit-category">Category</label>
                  <input
                    id="edit-category"
                    value={editForm.category}
                    onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                  />

                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={editForm.description}
                    onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                  />

                  <div className="form-actions">
                    <button className="signup-btn" type="submit" disabled={updatingPhoto}>
                      {updatingPhoto ? "Updating..." : "Update Photo"}
                    </button>
                    <button className="login-btn" type="button" disabled={updatingPhoto} onClick={cancelEditing}>
                      Cancel Edit
                    </button>
                  </div>
                </form>
              )}

              <div className="manager-list">
                {photos.map((photo) => {
                  const id = getPhotoId(photo);

                  return (
                    <article className="manager-item" key={id}>
                      <PhotoImage src={getPhotoUrl(photo)} alt={photo.title} className="manager-thumb" />

                      <div className="manager-item-info">
                        <strong>{photo.title || "Untitled photo"}</strong>
                        <span>{photo.category || "Other"}</span>
                        <small>{String(id).startsWith("sample-") ? "Sample photo · Browser storage" : "Database photo · MongoDB"}</small>
                      </div>

                      <div className="manager-item-actions">
                        <button
                          className="photo-action-btn"
                          onClick={() => startEditingPhoto(photo)}
                        >
                          Edit
                        </button>
                        <button
                          className="photo-action-btn delete-btn"
                          disabled={deletingPhotoId === id}
                          onClick={() => handleDeletePhoto(photo)}
                        >
                          {deletingPhotoId === id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <div className="photo-grid">
            {filteredPhotos.map((photo) => {
              const id = getPhotoId(photo);

              return (
                <article className="photo-card" key={id}>
                  <button
                    type="button"
                    className="photo-image-button"
                    onClick={() => setSelectedPhoto(photo)}
                    aria-label={`View ${photo.title || "photo"}`}
                  >
                    <PhotoImage src={getPhotoUrl(photo)} alt={photo.title} className="photo-image" />
                  </button>

                  <div className="photo-info">
                    <span className="photo-category">{photo.category || "Other"}</span>
                    <h3>{photo.title || "Untitled photo"}</h3>
                    <p>{photo.description || "Explore this beautiful photo."}</p>
                    <div className="photo-actions">
                      <button className="photo-action-btn" onClick={() => handleDownload(photo)}>
                        Download
                      </button>
                      <button className="photo-action-btn" onClick={() => setSelectedPhoto(photo)}>
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPhotos.length === 0 && (
            <div className="empty-state">
              <h3>No photos found</h3>
              <p>Try another search term or select a different category.</p>
              <button
                className="login-btn"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <p className="tagline">ABOUT PHOTONEST</p>
          <h2>Every photo has a story</h2>
          <p>
            PhotoNest is an image gallery platform where you can explore
            photographs, search by category, and discover new inspiration.
            Logged-in users can add, edit, and delete photos.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="logo" href="#home">Photo<span>nest</span></a>
        <p>Discover. Explore. Get inspired.</p>
        <p>© {new Date().getFullYear()} PhotoNest</p>
      </footer>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close login window" onClick={() => setShowLogin(false)}>
              ×
            </button>

            <p className="tagline">WELCOME TO PHOTONEST</p>
            <h2 id="auth-title">{isSignup ? "Create account" : "Welcome back"}</h2>
            <p>{isSignup ? "Sign up to start managing your photos." : "Log in to manage your photo collection."}</p>

            <form onSubmit={handleAuth} className="auth-form">
              {isSignup && (
                <>
                  <label htmlFor="auth-name">Full name</label>
                  <input id="auth-name" name="name" type="text" required placeholder="Enter your name" />
                </>
              )}

              <label htmlFor="auth-email">Email address</label>
              <input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="Enter your email" />

              <label htmlFor="auth-password">Password</label>
              <div className="password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="Enter your password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((previous) => !previous)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {authMessage && <p className="auth-message" role="status">{authMessage}</p>}

              <button className="signup-btn auth-submit" type="submit" disabled={loading}>
                {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
              </button>
            </form>

            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "New to PhotoNest?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignup((previous) => !previous);
                  setAuthMessage("");
                  setShowPassword(false);
                }}
              >
                {isSignup ? "Login" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="modal-overlay photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div
            className="photo-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Photo details"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" aria-label="Close photo details" onClick={() => setSelectedPhoto(null)}>
              ×
            </button>

            <PhotoImage src={getPhotoUrl(selectedPhoto)} alt={selectedPhoto.title} className="detail-image" />

            <div className="detail-content">
              <span className="photo-category">{selectedPhoto.category || "Other"}</span>
              <h2>{selectedPhoto.title || "Untitled photo"}</h2>
              <p>{selectedPhoto.description || "Explore this beautiful photo."}</p>
              <button className="signup-btn" onClick={() => handleDownload(selectedPhoto)}>
                Download Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}