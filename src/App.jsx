import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "https://back-a9dq.onrender.com/api";

const emptyForm = {
  productId: "",
  barcode: "",
  brandName: "",
  category: "",
  bottleSizeML: "750",
  emptyBottleWeightG: "400",
  costPrice: "",
  sellingPrice: "",
  outlet: "",
  location: "Stock Room",
  status: "Active",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("inventoryAdminLoggedIn") === "true";
  });

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [bottles, setBottles] = useState([]);
  const [readings, setReadings] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("bottles");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalBottles = bottles.length;
  const totalValue = useMemo(() => {
    return bottles.reduce((sum, item) => sum + Number(item.costPrice || 0), 0);
  }, [bottles]);

  const activeBottles = useMemo(() => {
    return bottles.filter((item) => item.status !== "Inactive").length;
  }, [bottles]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (loginForm.username === "admin" && loginForm.password === "1234") {
      localStorage.setItem("inventoryAdminLoggedIn", "true");
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  const logout = () => {
    localStorage.removeItem("inventoryAdminLoggedIn");
    setIsLoggedIn(false);
    setLoginForm({ username: "", password: "" });
  };

  const fetchBottles = async () => {
    try {
      setLoading(true);
      const url = search.trim()
        ? `${API_URL}/bottles?search=${encodeURIComponent(search.trim())}`
        : `${API_URL}/bottles`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to fetch bottles");
      }

      const data = await response.json();
      setBottles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bottles");
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      const response = await fetch(`${API_URL}/readings`);

      if (!response.ok) {
        throw new Error("Unable to fetch readings");
      }

      const data = await response.json();
      setReadings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBottles();
      fetchReadings();
    }
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setError("");
  };

  const submitBottle = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.barcode.trim() || !form.brandName.trim()) {
      setError("Barcode and Brand Name are required.");
      return;
    }

    const payload = {
      ...form,
      barcode: form.barcode.trim(),
      productId: form.productId.trim(),
      brandName: form.brandName.trim(),
      bottleSizeML: Number(form.bottleSizeML || 0),
      emptyBottleWeightG: Number(form.emptyBottleWeightG || 0),
      costPrice: Number(form.costPrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
    };

    try {
      setLoading(true);

      const response = await fetch(
        editingId ? `${API_URL}/bottles/${editingId}` : `${API_URL}/bottles`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage(editingId ? "Bottle updated successfully." : "Bottle added successfully.");
      resetForm();
      fetchBottles();
    } catch (err) {
      setError(err.message || "Failed to save bottle");
    } finally {
      setLoading(false);
    }
  };

  const editBottle = (bottle) => {
    setEditingId(bottle._id);
    setActiveTab("add");

    setForm({
      productId: bottle.productId || "",
      barcode: bottle.barcode || "",
      brandName: bottle.brandName || "",
      category: bottle.category || "",
      bottleSizeML: String(bottle.bottleSizeML || 750),
      emptyBottleWeightG: String(bottle.emptyBottleWeightG || 400),
      costPrice: String(bottle.costPrice || ""),
      sellingPrice: String(bottle.sellingPrice || ""),
      outlet: bottle.outlet || "",
      location: bottle.location || "Stock Room",
      status: bottle.status || "Active",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBottle = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this bottle?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bottles/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete bottle");
      }

      setMessage("Bottle deleted successfully.");
      fetchBottles();
    } catch (err) {
      setError(err.message || "Failed to delete bottle");
    } finally {
      setLoading(false);
    }
  };

  const deleteReading = async (id) => {
    const confirmDelete = window.confirm("Delete this reading?");
    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/readings/${id}`, {
        method: "DELETE",
      });

      fetchReadings();
    } catch (err) {
      console.warn(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="brand-mark">IN</div>
          <h1>Inventory Admin</h1>
          <p>Login to manage bottle database.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="admin"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="1234"
              />
            </label>

            <button type="submit">Login</button>
          </form>

          <small>Default: admin / 1234</small>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Inventory Admin Panel</h1>
          <p>Manage bottle database connected to scanner website.</p>
          <span className="api-pill">API: {API_URL}</span>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Bottles</span>
          <strong>{totalBottles}</strong>
        </div>

        <div className="stat-card">
          <span>Active Records</span>
          <strong>{activeBottles}</strong>
        </div>

        <div className="stat-card">
          <span>Total Cost Value</span>
          <strong>₹{totalValue.toLocaleString("en-IN")}</strong>
        </div>
      </section>

      <nav className="tabs">
        <button
          className={activeTab === "bottles" ? "active" : ""}
          onClick={() => setActiveTab("bottles")}
        >
          Bottle Database
        </button>

        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => {
            setActiveTab("add");
            if (!editingId) resetForm();
          }}
        >
          {editingId ? "Edit Bottle" : "Add Bottle"}
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => {
            setActiveTab("history");
            fetchReadings();
          }}
        >
          Scanned History
        </button>
      </nav>

      {message && <div className="success-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}

      {activeTab === "add" && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>{editingId ? "Edit Bottle" : "Add Bottle"}</h2>
              <p>Add bottle master data used by barcode scanner.</p>
            </div>

            {editingId && (
              <button className="secondary-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <form className="form-grid" onSubmit={submitBottle}>
            <label>
              Product ID
              <input
                name="productId"
                value={form.productId}
                onChange={handleChange}
                placeholder="P001"
              />
            </label>

            <label>
              Barcode *
              <input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="8901234567890"
              />
            </label>

            <label>
              Brand Name *
              <input
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                placeholder="Magic Moments Vodka"
              />
            </label>

            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Vodka / Rum / Whisky"
              />
            </label>

            <label>
              Bottle Size ML
              <input
                type="number"
                name="bottleSizeML"
                value={form.bottleSizeML}
                onChange={handleChange}
                placeholder="750"
              />
            </label>

            <label>
              Empty Bottle Weight G
              <input
                type="number"
                name="emptyBottleWeightG"
                value={form.emptyBottleWeightG}
                onChange={handleChange}
                placeholder="400"
              />
            </label>

            <label>
              Cost Price
              <input
                type="number"
                name="costPrice"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="520"
              />
            </label>

            <label>
              Selling Price
              <input
                type="number"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="700"
              />
            </label>

            <label>
              Outlet
              <select name="outlet" value={form.outlet} onChange={handleChange}>
                <option value="">Select Outlet</option>
                <option value="Pune Central">Pune Central</option>
                <option value="Pune Airport">Pune Airport</option>
                <option value="Pune NDA">Pune NDA</option>
              </select>
            </label>

            <label>
              Location
              <select name="location" value={form.location} onChange={handleChange}>
                <option value="Stock Room">Stock Room</option>
                <option value="Sky Bar">Sky Bar</option>
                <option value="Low Bar">Low Bar</option>
              </select>
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Bottle" : "Add Bottle"}
              </button>

              <button type="button" className="secondary-btn" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "bottles" && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Bottle Database</h2>
              <p>These records are used by the main scanner website.</p>
            </div>

            <button onClick={() => setActiveTab("add")}>+ Add Bottle</button>
          </div>

          <div className="search-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search barcode, product ID, brand name, category"
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchBottles();
              }}
            />
            <button onClick={fetchBottles}>Search</button>
            <button
              className="secondary-btn"
              onClick={() => {
                setSearch("");
                setTimeout(fetchBottles, 0);
              }}
            >
              Reset
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Barcode</th>
                  <th>Brand Name</th>
                  <th>Category</th>
                  <th>Size ML</th>
                  <th>Empty G</th>
                  <th>Cost</th>
                  <th>Outlet</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {bottles.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty">
                      {loading ? "Loading..." : "No bottles found."}
                    </td>
                  </tr>
                ) : (
                  bottles.map((bottle) => (
                    <tr key={bottle._id}>
                      <td>{bottle.productId}</td>
                      <td>{bottle.barcode}</td>
                      <td>{bottle.brandName}</td>
                      <td>{bottle.category}</td>
                      <td>{bottle.bottleSizeML}</td>
                      <td>{bottle.emptyBottleWeightG}</td>
                      <td>₹{Number(bottle.costPrice || 0).toLocaleString("en-IN")}</td>
                      <td>{bottle.outlet}</td>
                      <td>{bottle.location}</td>
                      <td>
                        <span className={bottle.status === "Inactive" ? "badge muted-badge" : "badge"}>
                          {bottle.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="small-btn" onClick={() => editBottle(bottle)}>
                            Edit
                          </button>
                          <button
                            className="small-btn danger"
                            onClick={() => deleteBottle(bottle._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Scanned History</h2>
              <p>Readings saved from scanner website.</p>
            </div>

            <button onClick={fetchReadings}>Refresh</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Barcode</th>
                  <th>Product ID</th>
                  <th>Brand Name</th>
                  <th>Category</th>
                  <th>Weight G</th>
                  <th>Remaining ML</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">
                      No readings found.
                    </td>
                  </tr>
                ) : (
                  readings.map((item) => (
                    <tr key={item._id}>
                      <td>{item.time || new Date(item.createdAt).toLocaleString()}</td>
                      <td>{item.barcode}</td>
                      <td>{item.productId}</td>
                      <td>{item.brandName}</td>
                      <td>{item.category}</td>
                      <td>{item.currentWeightG}</td>
                      <td>{item.remainingML}</td>
                      <td>
                        <button className="small-btn danger" onClick={() => deleteReading(item._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
