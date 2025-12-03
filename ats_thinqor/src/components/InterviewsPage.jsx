import React, { useState, useEffect } from "react";
import { FileText, Eye, Edit3, MessageSquare, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidateProgress } from "../auth/authSlice";

// ==================================
// STATUS COLORS + LABELS
// ==================================
const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REVIEW_REQUIRED: "bg-purple-100 text-purple-800",
  REJECTED: "bg-red-100 text-red-800",
};

// ==================================
// CANDIDATE CARD
// ==================================
function CandidateCard({ interview }) {
  const [showModal, setShowModal] = useState(false);

  const initials = interview.candidate_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const progressWidth = interview.current_stage
    ? `${((interview.current_stage / 5) * 100).toFixed(0)}%`
    : "20%";

  return (
    <>
      <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition mb-4">
        <div className="flex justify-between items-center">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow">
              {initials}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {interview.candidate_name}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[interview.status] ||
                    "bg-gray-100 text-gray-700"
                    }`}
                >
                  {interview.status?.replace("_", " ")}
                </span>

                <span className="text-gray-500 text-sm">
                  • Stage: {interview.stage_name || interview.current_stage}
                </span>
              </div>

              <p className="text-gray-400 text-xs mt-1">
                Updated {interview.updated_at ? interview.updated_at : "recently"}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <Eye size={16} /> View Details
            </button>
          </div>
        </div>
      </div>

      {/* ================== MODAL ================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-11/12 max-w-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-4">{interview.candidate_name}</h2>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[interview.status] || "bg-gray-100 text-gray-700"
                  }`}
              >
                {interview.status?.replace("_", " ")}
              </span>
            </p>
            <p className="mt-2">
              <strong>Current Stage:</strong> {interview.stage_name || interview.current_stage}
            </p>
            <p className="mt-2">
              <strong>Updated At:</strong> {interview.updated_at || "recently"}
            </p>
            {interview.notes && (
              <p className="mt-2">
                <strong>Notes:</strong> {interview.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ==================================
// MAIN PAGE
// ==================================
export default function InterviewsPage() {
  const dispatch = useDispatch();
  const { interviews, loading } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("A-Z");

  // Fetch Data
  useEffect(() => {
    dispatch(fetchCandidateProgress());
  }, [dispatch]);

  // Stats
  const total = interviews.length;
  const pending = interviews.filter((i) => i.status === "PENDING").length;
  const inProgress = interviews.filter((i) => i.status === "IN_PROGRESS").length;
  const completed = interviews.filter((i) => i.status === "COMPLETED").length;

  // Filtering
  let filtered = interviews.filter((i) => {
    const matchSearch =
      (i.candidate_name + (i.stage_name || ""))
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchStatus = filterStatus === "All" || i.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Sorting
  filtered = filtered.sort((a, b) => {
    if (sortOrder === "A-Z") return a.candidate_name.localeCompare(b.candidate_name);
    else return b.candidate_name.localeCompare(a.candidate_name);
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ====================== HERO ====================== */}
      <div className="bg-blue-100 rounded-2xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold">Interview Management</h1>
        <p className="text-black-100 mt-2">
          Streamline your hiring process with intelligent candidate tracking
        </p>
      </div>

      {/* ====================== STATS ====================== */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mt-8">
        <div className="bg-white shadow p-5 rounded-2xl text-center border">
          <p className="text-gray-600 text-sm">Total Interviews</p>
          <h2 className="text-3xl font-bold text-gray-800">{total}</h2>
        </div>

        <div className="bg-white shadow p-5 rounded-2xl text-center border">
          <p className="text-yellow-700 text-sm">Pending</p>
          <h2 className="text-3xl font-bold text-yellow-800">{pending}</h2>
        </div>

        <div className="bg-white shadow p-5 rounded-2xl text-center border">
          <p className="text-blue-700 text-sm">In Progress</p>
          <h2 className="text-3xl font-bold text-blue-800">{inProgress}</h2>
        </div>

        <div className="bg-white shadow p-5 rounded-2xl text-center border">
          <p className="text-green-700 text-sm">Completed</p>
          <h2 className="text-3xl font-bold text-green-800">{completed}</h2>
        </div>
      </div>

      {/* ====================== FILTERS ====================== */}
      <div className="flex flex-wrap gap-4 mt-6 bg-white p-4 rounded-2xl shadow border">
        <input
          type="text"
          placeholder="Search candidate or stage..."
          className="flex-1 border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-4 py-2 rounded-lg shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REVIEW_REQUIRED">Review Required</option>
        </select>
      </div>

      {/* ====================== CANDIDATE LIST ====================== */}
      <div className="mt-6">
        {loading ? (
          <p className="text-center text-gray-500 mt-10 text-lg">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 text-lg">
            No interviews found.
          </p>
        ) : (
          filtered.map((interview) => (
            <CandidateCard key={interview.id} interview={interview} />
          ))
        )}
      </div>
    </div>
  );
}