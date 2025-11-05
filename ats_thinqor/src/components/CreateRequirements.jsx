import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createRequirement, fetchClients } from "../auth/authSlice";

export default function CreateRequirements() {
  const dispatch = useDispatch();
  const { user, clients } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    client_id: "",
    title: "",
    description: "",
    location: "",
    skills_required: "",
    experience_required: "",
    ctc_range: "",
    ectc_range: "",
  });

  const canCreate = ["ADMIN", "DELIVERY_MANAGER"].includes(user?.role);

  useEffect(() => {
    dispatch(fetchClients());   // ✅ Load client list on page open
  }, [dispatch]);

  if (!canCreate) {
    return (
      <div className="flex justify-center mt-20 text-red-600 font-semibold">
        ❌ You are not allowed to create requirements
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createRequirement(form))
      .unwrap()
      .then(() => {
        alert("✅ Requirement Created Successfully!");
        setForm({
          client_id: "",
          title: "",
          description: "",
          location: "",
          skills_required: "",
          experience_required: "",
          ctc_range: "",
          ectc_range: "",
        });
      })
      .catch(() => alert("❌ Error creating requirement"));
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">
        Create New Requirement
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">

        {/* ✅ Client Dropdown */}
        <select
          name="client_id"
          value={form.client_id}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
          required
        >
          <option value="">Select Client</option>
          {clients?.length > 0 &&
            clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {/* ✅ correct field */}
              </option>
            ))}
        </select>

        <input name="title" placeholder="Job Title" value={form.title} onChange={handleChange} className="border p-2 rounded" required/>
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="border p-2 rounded" required/>

        <input name="experience_required" placeholder="Experience (years)" value={form.experience_required} onChange={handleChange} className="border p-2 rounded"/>
        <input name="skills_required" placeholder="Skills (comma separated)" value={form.skills_required} onChange={handleChange} className="border p-2 rounded"/>

        <input name="ctc_range" placeholder="CTC Range" value={form.ctc_range} onChange={handleChange} className="border p-2 rounded"/>
        <input name="ectc_range" placeholder="Expected CTC" value={form.ectc_range} onChange={handleChange} className="border p-2 rounded"/>

        <textarea name="description" placeholder="Job Description" value={form.description} onChange={handleChange} className="border p-2 rounded col-span-2 h-24" required></textarea>
        
        <button className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 col-span-2">
          Create Requirement
        </button>
      </form>
    </div>
  );
}