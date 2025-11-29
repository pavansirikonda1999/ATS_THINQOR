// src/components/Interviews.jsx
import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";

/* ============================================================
    Interview Card Component
============================================================ */
function InterviewCard({ interview }) {
  const handleViewDetails = () => {
    alert(
      `Candidate Details:\nName: ${interview.candidate_name}\nStage: ${interview.current_stage}\nStatus: ${interview.status}`
    );
  };

  return (
    <div className="bg-white shadow rounded-xl p-5 border hover:shadow-md transition my-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-3">
            {interview.candidate_name}
            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded">
              {interview.status}
            </span>
          </h3>

          <div className="mt-3 text-gray-600">
            Current Stage:{" "}
            <span className="font-medium text-blue-700">{interview.current_stage}</span>
          </div>

          <div className="mt-2 text-gray-500 text-sm">
            Manual Decision: {interview.manual_decision}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            onClick={handleViewDetails}
          >
            <FileText size={16} /> View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
    Main Page: Interviews
============================================================ */
export default function InterviewsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [interviews, setInterviews] = useState([]);

  /* ---------------------------
       Fetch candidate_progress data
       Only active statuses (PENDING, IN_PROGRESS, COMPLETED)
  ----------------------------*/
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/candidate_progress")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((i) =>
          ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(i.status)
        );
        setInterviews(filtered);
      })
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  /* ---------------------------
       Stats
  ----------------------------*/
  const total = interviews.length;
  const pending = interviews.filter((i) => i.status === "PENDING").length;
  const inProgress = interviews.filter((i) => i.status === "IN_PROGRESS").length;
  const completed = interviews.filter((i) => i.status === "COMPLETED").length;

  /* ---------------------------
       Filtered List based on search & status
  ----------------------------*/
  const filtered = interviews.filter((i) => {
    const matchesSearch = (i.candidate_name + i.current_stage)
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || i.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interview Management</h1>
          <p className="text-gray-500">Real-time overview of all Candidate Interviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white shadow rounded-xl border">
          <h3 className="text-gray-600 text-sm">Total</h3>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="p-5 bg-white shadow rounded-xl border">
          <h3 className="text-gray-600 text-sm">Pending</h3>
          <p className="text-2xl font-bold">{pending}</p>
        </div>
        <div className="p-5 bg-white shadow rounded-xl border">
          <h3 className="text-gray-600 text-sm">In Progress</h3>
          <p className="text-2xl font-bold">{inProgress}</p>
        </div>
        <div className="p-5 bg-white shadow rounded-xl border">
          <h3 className="text-gray-600 text-sm">Completed</h3>
          <p className="text-2xl font-bold">{completed}</p>
        </div>
      </div>

      {/* Search + Status Filter */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search candidate or stage"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border px-4 py-2 rounded-lg"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Candidate List */}
      <div>
        {filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-10">
            No candidates found
          </div>
        ) : (
          filtered.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))
        )}
      </div>
    </div>
  );
}
