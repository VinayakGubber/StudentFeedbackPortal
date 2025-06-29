const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "70887088",
  database: "StudentFeedback",
});

/*POST Methods*/

// Login Route Setup
app.post("/login", async (req, res) => {
  const { rollNumber, password } = req.body;

  if (!rollNumber || !password) {
    return res.status(400).json({ message: "Missing roll number or password" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE roll_number = ? LIMIT 1`,
      [rollNumber]
    );

    const user = rows[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      roll_number: user.roll_number,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Complaint Submission Route
app.post("/complaints", async (req, res) => {
  const { name, roll_no, email, mobile, category, message } = req.body;

  if (!name || !roll_no || !email || !mobile || !category || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await pool.query(
      `INSERT INTO complaints (name, roll_no, email, mobile, category, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, roll_no, email, mobile, category, message]
    );

    return res
      .status(201)
      .json({ message: "Complaint submitted successfully" });
  } catch (err) {
    console.error("Insert complaint error:", err);
    return res
      .status(500)
      .json({ message: "Server error while submitting complaint" });
  }
});

/*GET Methods*/

// View complaints (Student)
app.get("/complaints/:rollNumber", async (req, res) => {
  const { rollNumber } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT category, message, status, created_at FROM complaints WHERE roll_no = ? ORDER BY created_at DESC",
      [rollNumber]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Fetch complaints error:", err);
    return res.status(500).json({ message: "Error fetching complaints" });
  }
});

// View complaints (Admin)
app.get("/admin/complaints", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM complaints ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Admin complaints fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change compalint status(Admin)
app.put("/admin/complaints/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "In Progress", "Resolved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await pool.query("UPDATE complaints SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete complaint (Admin)
app.delete("/admin/complaints/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM complaints WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Delete complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update count (Admin)
app.get("/admin/complaints/stats", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'In Progress') AS inProgress,
        SUM(status = 'Resolved') AS resolved
      FROM complaints
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching complaint stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
