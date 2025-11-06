import React, { useState, useEffect } from "react";

export default function CandidateApplicationUI() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    education: "",
    experience: "",
  });
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [editCandidateId, setEditCandidateId] = useState(null);

  // Fetch all candidates from backend
  const fetchCandidates = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get-candidates");
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input
  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  // Submit or Update candidate
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (resume) data.append("resume", resume);

    try {
      let url = "http://127.0.0.1:5000/submit-candidate";
      let method = "POST";

      if (editCandidateId) {
        url = `http://127.0.0.1:5000/update-candidate/${editCandidateId}`;
        method = "PUT";
      }

      const response = await fetch(url, { method, body: data });
      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message}`);
        fetchCandidates(); // refresh list
        setFormData({
          name: "",
          email: "",
          phone: "",
          skills: "",
          education: "",
          experience: "",
        });
        setResume(null);
        setEditCandidateId(null);
      } else {
        setMessage(`❌ ${result.message || "Failed to submit"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Server not reachable. Check backend.");
    }
  };

  // Edit candidate
  const handleEdit = (candidate) => {
    setEditCandidateId(candidate.id);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills,
      education: candidate.education,
      experience: candidate.experience,
    });
    setMessage("✏ Editing candidate...");
  };

  // Delete candidate
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/delete-candidate/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        setMessage(`🗑 ${result.message}`);
        fetchCandidates();
      } else {
        setMessage(`❌ ${result.message || "Failed to delete"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Server not reachable. Check backend.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-2xl space-y-10">
      {/* Form Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          {editCandidateId ? "✏ Edit Candidate" : "🧾 Candidate Application"}
        </h2>

        {message && (
          <p className="text-center mb-4 font-medium text-green-600">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="Enter full name"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="you@example.com"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skills</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                type="text"
                placeholder="React, Node.js, SQL..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Education Summary</label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder="E.g., B.Tech in Computer Science from XYZ University"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Experience Summary</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="E.g., 3 years as Frontend Developer at ABC Corp"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Resume (PDF/DOCX)</label>
            <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition">
              <input
                type="file"
                id="resume"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
              />
              <label
                htmlFor="resume"
                className="cursor-pointer text-green-600 hover:underline"
              >
                {editCandidateId ? "Click to upload new resume (optional)" : "Click to upload resume"}
              </label>
              {resume && <p className="text-sm text-gray-700 mt-2">{resume.name}</p>}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              {editCandidateId ? "Update Candidate" : "Submit Application"}
            </button>

            <button
              type="reset"
              className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-100 transition"
              onClick={() => {
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  skills: "",
                  education: "",
                  experience: "",
                });
                setResume(null);
                setEditCandidateId(null);
                setMessage("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Candidate List Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">📋 Candidate List</h2>

        {candidates.length === 0 ? (
          <p className="text-gray-500 text-center">No candidates found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-100 text-left">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Skills</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{candidate.name}</td>
                  <td className="p-3 border">{candidate.email}</td>
                  <td className="p-3 border">{candidate.phone}</td>
                  <td className="p-3 border">{candidate.skills}</td>
                  <td className="p-3 border flex gap-2">
                    <button
                      onClick={() => handleEdit(candidate)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}