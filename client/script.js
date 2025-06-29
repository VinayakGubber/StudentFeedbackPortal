document.addEventListener("DOMContentLoaded", () => {
  const isStudentPage = document.getElementById("studentLoginView") !== null;
  const isAdminPage = document.getElementById("adminLoginView") !== null;

  if (isStudentPage) setupStudentLogic();
  if (isAdminPage) setupAdminLogic();
});

// STUDENT LOGIC
const studentLoginForm = document.getElementById("studentLoginForm");

studentLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const rollNumber = document.getElementById("studentRoll").value.trim();
  const password = document.getElementById("studentPassword").value;

  if (!rollNumber || !password)
    return alert("Enter both roll number and password");

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Save user to localStorage
    localStorage.setItem("student", JSON.stringify(data));

    // Populate read-only fields
    setTimeout(() => {
      document.getElementById("name").value = data.name || "";
      document.getElementById("rollNo").value = data.roll_number;
      document.getElementById("email").value = data.email || "";
      document.getElementById("mobile").value = data.mobile || "";
    }, 0);

    // Switch to complaint view
    document.getElementById("studentLoginView").style.display = "none";
    document.getElementById("studentComplaintView").style.display = "block";

    // ✅ Load previous complaints immediately after login
    loadStudentComplaints(data.roll_number);
  } catch (err) {
    alert(err.message);
  }
});

// Function to Store Complaints
const complaintForm = document.getElementById("complaintForm");

complaintForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateComplaintForm()) return;

  const complaint = {
    name: complaintForm.name.value.trim(),
    roll_no: complaintForm.rollNo.value.trim(),
    email: complaintForm.email.value.trim(),
    mobile: complaintForm.mobile.value.trim(),
    category: complaintForm.category.value,
    message: complaintForm.message.value.trim(),
  };

  try {
    const res = await fetch("http://localhost:3000/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaint),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("Complaint submitted successfully.");
    complaintForm.reset();
    loadStudentComplaints(complaint.roll_no); // Refresh the list
  } catch (err) {
    console.error("Submit error:", err);
    alert("Error submitting complaint: " + err.message);
  }
});

//Function to Fetch Posted Complaints (SELF)
async function loadStudentComplaints(rollNumber) {
  const tbody = document.querySelector("#studentComplaintsTable tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  try {
    const res = await fetch(`http://localhost:3000/complaints/${rollNumber}`);
    const data = await res.json();

    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='4' style='text-align:center'>No complaints yet.</td></tr>";
      return;
    }

    data.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.category}</td>
        <td>${c.message}</td>
        <td><span class="badge ${c.status.replace(" ", "")}">${
        c.status
      }</span></td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading complaints:", err);
    tbody.innerHTML =
      "<tr><td colspan='4' style='text-align:center'>Failed to load complaints</td></tr>";
  }
}

function validateComplaintForm() {
  const form = document.getElementById("complaintForm");
  if (!form.name.value.trim()) return alert("Enter name");
  if (!form.rollNo.value.trim()) return alert("Enter roll number");
  if (!form.email.value.trim()) return alert("Enter email");
  if (!form.mobile.value.trim()) return alert("Enter mobile");
  if (!form.category.value) return alert("Choose category");
  if (!form.message.value.trim()) return alert("Enter complaint message");
  return true;
}

// ADMIN LOGIC
function setupAdminLogic() {
  const adminLoginForm = document.getElementById("adminLoginForm");

  adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = adminLoginForm.adminUsername.value.trim();
    const password = adminLoginForm.adminPassword.value;
    if (username === "admin" && password === "admin") {
      sessionStorage.setItem("adminLoggedIn", "true");
      document.getElementById("adminLoginView").style.display = "none";
      document.getElementById("adminPortalView").style.display = "block";
      renderAdminComplaints();
      updateTotalComplaintCount();
    } else {
      alert("Invalid login");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("adminLoggedIn");
    location.reload();
  });

  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    document.getElementById("adminLoginView").style.display = "none";
    document.getElementById("adminPortalView").style.display = "block";
    renderAdminComplaints();
    updateTotalComplaintCount();
  }

  document
    .getElementById("filterCategory")
    .addEventListener("change", renderAdminComplaints);
  document
    .getElementById("filterStatus")
    .addEventListener("change", renderAdminComplaints);
  document
    .getElementById("searchInput")
    .addEventListener("input", renderAdminComplaints);

  document.querySelector("#complaintsTable").addEventListener("change", (e) => {
    if (e.target.classList.contains("statusSelect")) {
      const id = Number(e.target.dataset.id);
      const newStatus = e.target.value;
      updateComplaintStatus(id, newStatus);
    }
  });

  document.querySelector("#complaintsTable").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete")) {
      const id = Number(e.target.dataset.id);
      deleteComplaint(id);
    }
  });
}

async function renderAdminComplaints() {
  const tbody = document.querySelector("#complaintsTable tbody");
  const cat = document.getElementById("filterCategory").value;
  const status = document.getElementById("filterStatus").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  tbody.innerHTML = "<tr><td colspan='8'>Loading...</td></tr>";

  try {
    const res = await fetch("http://localhost:3000/admin/complaints");
    const all = await res.json();

    let list = all;

    // Apply filters
    if (cat !== "All") list = list.filter((c) => c.category === cat);
    if (status !== "All") list = list.filter((c) => c.status === status);
    if (search) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.roll_no.toLowerCase().includes(search) ||
          c.message.toLowerCase().includes(search)
      );
    }

    // Render table
    tbody.innerHTML = "";
    if (list.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='8' style='text-align:center'>No complaints found.</td></tr>";
      return;
    }

    list.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.roll_no}</td>
        <td>${c.email}</td>
        <td>${c.mobile}</td>
        <td>${c.category}</td>
        <td>${c.message}</td>
        <td>
          <select class="statusSelect" data-id="${c.id}">
            <option value="Pending" ${
              c.status === "Pending" ? "selected" : ""
            }>Pending</option>
            <option value="In Progress" ${
              c.status === "In Progress" ? "selected" : ""
            }>In Progress</option>
            <option value="Resolved" ${
              c.status === "Resolved" ? "selected" : ""
            }>Resolved</option>
          </select>
        </td>
        <td><button class="btn-delete" data-id="${c.id}">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });

    updateTotalComplaintCount();
  } catch (err) {
    console.error("Error loading complaints:", err);
    tbody.innerHTML =
      "<tr><td colspan='8' style='text-align:center'>Failed to load complaints.</td></tr>";
  }
}

async function updateComplaintStatus(id, status) {
  try {
    const res = await fetch(
      `http://localhost:3000/admin/complaints/${id}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Refresh complaints list
    renderAdminComplaints();
  } catch (err) {
    console.error("Failed to update complaint status:", err);
    alert("Error updating status: " + err.message);
  }
}

async function deleteComplaint(id) {
  if (!confirm("Are you sure you want to delete this complaint?")) return;

  try {
    const res = await fetch(`http://localhost:3000/admin/complaints/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert("Complaint deleted successfully.");
    renderAdminComplaints();
  } catch (err) {
    console.error("Error deleting complaint:", err);
    alert("Failed to delete complaint: " + err.message);
  }
}

async function updateTotalComplaintCount() {
  try {
    const res = await fetch("http://localhost:3000/admin/complaints/stats");
    const data = await res.json();

    document.getElementById("totalCount").textContent = data.total || 0;
    document.getElementById("pendingCount").textContent = data.pending || 0;
    document.getElementById("inProgressCount").textContent =
      data.inProgress || 0;
    document.getElementById("resolvedCount").textContent = data.resolved || 0;
  } catch (err) {
    console.error("Failed to load complaint stats:", err);
  }
}
