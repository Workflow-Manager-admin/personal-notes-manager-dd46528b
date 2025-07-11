import React, { useEffect, useState } from "react";
import "./App.css";

/**
 * App root for Notes Manager.
 *
 * Top-level layout: nav, main content (auth or notes grid), modals.
 * Handles authentication flow, API error/global state, and theme.
 */

// Accent, primary, secondary palette from requirements
const APP_COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ffb300",
};

// Backend API base (mod: override with REACT_APP_BACKEND_URL if .env exists)
const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/api";

// PUBLIC_INTERFACE
function App() {
  // App global state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(""); // basic auth, just use username:password base64 for demo
  const [username, setUsername] = useState(""); // for header/nav
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeNote, setActiveNote] = useState(null); // for edit
  const [showModal, setShowModal] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  /** API HANDLERS **/

  // PUBLIC_INTERFACE
  async function apiLogin(user, pass) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setIsAuthenticated(true);
        setUsername(user);
        return true;
      }
      setError("Login failed: Invalid credentials.");
    } catch (e) {
      setError("Network error during login.");
    }
    setLoading(false);
    return false;
  }

  // PUBLIC_INTERFACE
  function apiAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  }

  // PUBLIC_INTERFACE
  async function fetchNotes(query="") {
    setLoading(true);
    setError("");
    try {
      let url = `${API_BASE}/notes/`;
      if (query) url += `?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: apiAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch notes");
      const notesData = await res.json();
      setNotes(notesData);
    } catch (e) {
      setError("Could not load notes.");
      setNotes([]);
    }
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  async function createNote(note) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes/`, {
        method: "POST",
        headers: apiAuthHeaders(),
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error("Create failed");
      await fetchNotes("");
      setShowModal(false);
    } catch (e) {
      setError("Failed to create note.");
    }
    setLoading(false);
  }
  // PUBLIC_INTERFACE
  async function updateNote(id, note) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes/${id}/`, {
        method: "PUT",
        headers: apiAuthHeaders(),
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchNotes("");
      setShowModal(false);
      setActiveNote(null);
    } catch (e) {
      setError("Failed to update note.");
    }
    setLoading(false);
  }
  // PUBLIC_INTERFACE
  async function deleteNote(id) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/notes/${id}/`, {
        method: "DELETE",
        headers: apiAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchNotes("");
    } catch (e) {
      setError("Failed to delete note.");
    }
    setLoading(false);
  }

  // On login, fetch notes
  useEffect(() => {
    if (isAuthenticated) fetchNotes();
    // eslint-disable-next-line
  }, [isAuthenticated]);

  // Handler for logout
  function handleLogout() {
    setIsAuthenticated(false);
    setToken("");
    setUsername("");
    setNotes([]);
    setActiveNote(null);
    setShowModal(false);
  }

  // Handler for search
  function handleSearchChange(e) {
    setSearchInput(e.target.value);
    fetchNotes(e.target.value);
  }

  /** UI COMPONENTS **/

  // PUBLIC_INTERFACE
  function TopNav() {
    return (
      <nav style={{
        backgroundColor: APP_COLORS.primary, color: '#fff',
        display: "flex", padding: "12px 20px", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{fontWeight: 700, fontSize: "1.25rem", letterSpacing: 0.5}}>
          <span style={{color: APP_COLORS.accent}}>🗒️ Notes</span> Manager
        </div>
        <div>
          {isAuthenticated && (
            <span style={{marginRight: 16, fontWeight: 500}}>Hello, {username}</span>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{
                border: "none", borderRadius: 6, background: APP_COLORS.secondary, color: "#fff",
                padding: "6px 14px", fontWeight: 600, cursor: "pointer"
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    );
  }

  // PUBLIC_INTERFACE
  function LoginForm() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    return (
      <div style={{maxWidth: 340, margin: "56px auto", padding: 24, borderRadius: 12, background: "#fff", boxShadow: "0 2px 12px #ececec"}}>
        <h2 style={{marginBottom: 20, color: APP_COLORS.primary}}>Sign In</h2>
        {error && <div style={{color: "#d32f2f", marginBottom: 8}}>{error}</div>}
        <form onSubmit={async e => {
          e.preventDefault();
          setLoading(true);
          await apiLogin(user, pass);
          setLoading(false);
        }}>
          <label style={{fontWeight: 500, fontSize: 14}}>Username</label>
          <input
            type="text"
            value={user}
            onChange={e => setUser(e.target.value)}
            autoFocus
            style={{width: "100%", marginBottom: 12, padding: 8, border: "1px solid #dedede", borderRadius: 6, fontSize: 15}}
            required
          />
          <label style={{fontWeight: 500, fontSize: 14}}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            style={{width: "100%", marginBottom: 16, padding: 8, border: "1px solid #dedede", borderRadius: 6, fontSize: 15}}
            required
          />
          <button type="submit" style={{
            width: "100%", padding: 11, background: APP_COLORS.primary, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 15
            }}>
            {loading ? "..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function NotesList() {
    return (
      <div style={{maxWidth: 600, margin: "30px auto 20px auto"}}>
        <div style={{display: "flex", gap: 8, marginBottom: 22}}>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchInput}
            onChange={handleSearchChange}
            style={{
              flex: 1, padding: 9, fontSize: 15, border: "1px solid #bbb", borderRadius: 7
            }}
          />
          <button onClick={() => {setActiveNote(null); setShowModal(true);}}
            style={{
              background: APP_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, borderRadius: 7,
              padding: "9px 23px", fontSize: 15, cursor: "pointer"
            }}>
            + Note
          </button>
        </div>
        {error && <div style={{color: "#d32f2f", marginBottom: 7}}>{error}</div>}
        {loading && <div style={{margin: "25px 0", textAlign: "center"}}>Loading...</div>}
        {notes.length === 0 && !loading ? <div style={{textAlign: "center", color: "#757575"}}>No notes to show.</div> : (
          <div>
            {notes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function NoteCard({ note }) {
    return (
      <div style={{
        border: `1.5px solid #eeeeee`, borderRadius: 8, padding: 16, marginBottom: 14, background: "#fafbfc",
        boxShadow: "0 1px 3px #f5f5f5"
      }}>
        <div style={{fontWeight: 600, fontSize: 17, color: APP_COLORS.primary, marginBottom: 4}}>{note.title}</div>
        <div style={{margin: "5px 0 7px 0", fontSize: 15, color: "#353535", minHeight: 24, whiteSpace: "pre-line"}}>{note.content}</div>
        <div style={{color: "#bababa", fontSize: 12}}>Created: {formatDate(note.created_at)}</div>
        <div style={{marginTop: 10, display: "flex", gap: 12}}>
          <button
            onClick={() => {setActiveNote(note); setShowModal(true);}}
            style={{
              background: APP_COLORS.primary, color: "#fff", border: "none", padding: "5px 17px",
              fontWeight: 600, fontSize: 14, borderRadius: 6, cursor: "pointer"
            }}>
            Edit
          </button>
          <button
            onClick={() => window.confirm("Delete this note?") && deleteNote(note.id)}
            style={{
              background: "#d32f2f", color: "#fff", border: "none", padding: "5.5px 15px",
              borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer"
            }}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  function NoteModal({ open, onClose, note, onSave }) {
    // Local state for new/edit
    const [title, setTitle] = useState(note ? note.title : "");
    const [content, setContent] = useState(note ? note.content : "");
    useEffect(() => {
      setTitle(note ? note.title : "");
      setContent(note ? note.content : "");
    }, [note, open]);
    const isEdit = !!note;

    function handleSubmit(e) {
      e.preventDefault();
      if (!title.trim()) return setError("Title required");
      if (!content.trim()) return setError("Content required");
      if (isEdit) {
        onSave(note.id, { title, content });
      } else {
        onSave({ title, content });
      }
    }
    if (!open) return null;
    return (
      <div style={{
        position: "fixed", zIndex: 30, left: 0, top: 0, width: "100vw", height: "100vh",
        background: "rgba(52,52,55,0.22)", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          background: "#fff", padding: 32, minWidth: 340, maxWidth: 420, borderRadius: 14,
          boxShadow: "0 2px 18px #d4dde0", position: "relative"
        }}>
          <button
            style={{
              position: "absolute", top: 17, right: 14, background: "none", border: "none", fontSize: 21, cursor: "pointer", color: "#9e9e9e"
            }}
            onClick={onClose}
            aria-label="Close"
          >&times;</button>
          <h2 style={{marginBottom: 16, color: APP_COLORS.primary}}>{isEdit ? "Edit Note" : "New Note"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom: 14}}>
              <label style={{fontWeight: 500, fontSize: 14}}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{width: "100%", padding: 9, fontSize: 15, marginTop: 2, border: "1px solid #dedede", borderRadius: 7}}
                required
                maxLength={60}
              />
            </div>
            <div style={{marginBottom: 14}}>
              <label style={{fontWeight: 500, fontSize: 14}}>Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{width: "100%", padding: 8, fontSize: 15, minHeight: 90, border: "1px solid #dedede", borderRadius: 7, resize: "vertical"}}
                required
                maxLength={1500}
              />
            </div>
            <button type="submit"
              style={{
                width: "100%", margin: "16px 0 0 0", background: APP_COLORS.primary, color: "#fff", border: "none", borderRadius: 7,
                fontWeight: 700, padding: "10px 0", fontSize: 16, cursor: "pointer"
              }}>
              {loading ? "..." : isEdit ? "Save Changes" : "Create Note"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Utility: date formatting, fallback
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toLocaleDateString() + " " + d.toLocaleTimeString().slice(0, 5);
  }

  // --- Render ---
  return (
    <div className="App" style={{background: "#f7f7fa", minHeight: "100vh"}}>
      <TopNav />
      {isAuthenticated ? (
        <>
          <NotesList />
          <NoteModal
            open={showModal}
            onClose={() => { setShowModal(false); setActiveNote(null); setError(""); }}
            note={activeNote}
            onSave={(...args) => {
              if (activeNote) {
                // Edit
                updateNote(...args);
              } else {
                // Create
                createNote(args[0]);
              }
            }}
          />
        </>
      ) : (
        <LoginForm />
      )}
      {/* App-wide error */}
      {error && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", background: "#d32f2f",
          color: "#fff", padding: "7px 18px", zIndex: 99, borderRadius: 6, fontWeight: 500, boxShadow: "0 3px 12px #e46464",
          minWidth: 220, maxWidth: 440, marginTop: 30, fontSize: 15
        }}>
          {error}
          <button onClick={() => setError("")} style={{border: "none", background: "none", color: "#fff", marginLeft: 16, fontWeight: 700, cursor: "pointer"}}>x</button>
        </div>
      )}
    </div>
  );
}

export default App;
