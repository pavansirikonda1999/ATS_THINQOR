import React, { useEffect, useState } from "react";
import { ArrowLeft, Download, ChevronRight, BarChart2, PieChart, Users, FileText, Briefcase } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useDispatch, useSelector } from "react-redux";
import { fetchReportClients, fetchReportRequirements, fetchReportStats } from "../auth/authSlice";

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
    const dispatch = useDispatch();
    const { reportClients, reportRequirements, reportStats, loading, error } = useSelector((state) => state.auth);

    const [view, setView] = useState('CLIENTS'); // CLIENTS, REQUIREMENTS, STATS
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedReq, setSelectedReq] = useState(null);

    // Fetch Clients
    useEffect(() => {
        if (view === 'CLIENTS') {
            dispatch(fetchReportClients());
        } else if (view === 'REQUIREMENTS' && selectedClient) {
            dispatch(fetchReportRequirements(selectedClient.id));
        } else if (view === 'STATS' && selectedReq) {
            dispatch(fetchReportStats(selectedReq.id));
        }
    }, [view, selectedClient, selectedReq, dispatch]);

    const handleClientClick = (client) => {
        setSelectedClient(client);
        setView('REQUIREMENTS');
    };

    const handleReqClick = (req) => {
        setSelectedReq(req);
        setView('STATS');
    };

    const handleBack = () => {
        if (view === 'STATS') {
            setView('REQUIREMENTS');
            setSelectedReq(null);
        } else if (view === 'REQUIREMENTS') {
            setView('CLIENTS');
            setSelectedClient(null);
        }
    };

    // Determine list data based on view
    const listData = view === 'CLIENTS' ? reportClients : (view === 'REQUIREMENTS' ? reportRequirements : []);

    // --- RENDER HELPERS ---

    const renderClients = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listData.map(client => (
                <div
                    key={client.id}
                    onClick={() => handleClientClick(client)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition cursor-pointer group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{client.name}</h3>
                                <p className="text-sm text-gray-500">View Requirements</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition" />
                    </div>
                </div>
            ))}
            {listData.length === 0 && !loading && (
                <div className="col-span-full text-center py-10 text-gray-400">No clients found.</div>
            )}
        </div>
    );

    const renderRequirements = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="cursor-pointer hover:text-indigo-600" onClick={handleBack}>Clients</span>
                <ChevronRight size={14} />
                <span className="font-medium text-gray-900">{selectedClient?.name}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {listData.map(req => (
                    <div
                        key={req.id}
                        onClick={() => handleReqClick(req)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition cursor-pointer flex items-center justify-between group"
                    >
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition">{req.title}</h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {req.status}
                                </span>
                                <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition" />
                    </div>
                ))}
                {listData.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No requirements found for this client.</div>
                )}
            </div>
        </div>
    );

    const renderStats = () => {
        if (!reportStats) return null;
        const { requirement, stats, total_candidates } = reportStats;

        // Prepare chart data
        // Group by stage_name
        const stageMap = {};
        stats.forEach(item => {
            if (!stageMap[item.stage_name]) {
                stageMap[item.stage_name] = { name: item.stage_name, count: 0 };
            }
            stageMap[item.stage_name].count += item.count;
        });
        const chartData = Object.values(stageMap);

        // Status distribution (Pending, In Progress, Completed, Rejected)
        const statusMap = {};
        stats.forEach(item => {
            if (!statusMap[item.status]) {
                statusMap[item.status] = { name: item.status, value: 0 };
            }
            statusMap[item.status].value += item.count;
        });
        const pieData = Object.values(statusMap);

        return (
            <div className="space-y-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="cursor-pointer hover:text-indigo-600" onClick={() => { setView('CLIENTS'); setSelectedClient(null); }}>Clients</span>
                    <ChevronRight size={14} />
                    <span className="cursor-pointer hover:text-indigo-600" onClick={handleBack}>{selectedClient?.name}</span>
                    <ChevronRight size={14} />
                    <span className="font-medium text-gray-900">{requirement.title}</span>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium">Total Candidates</div>
                        <div className="text-3xl font-bold mt-2 text-gray-900">{total_candidates}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium">Rounds</div>
                        <div className="text-3xl font-bold mt-2 text-indigo-600">{requirement.no_of_rounds}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium">Status</div>
                        <div className="text-3xl font-bold mt-2 text-gray-900">{requirement.status}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart: Candidates by Stage */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-6">Candidates by Stage</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart: Status Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-6">Status Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-lg font-semibold">Detailed Stage Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Stage</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.stage_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium 
                                                ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.count}</td>
                                    </tr>
                                ))}
                                {stats.length === 0 && (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No data available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {view !== 'CLIENTS' && (
                            <button onClick={handleBack} className="text-gray-500 hover:text-gray-800 transition">
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-gray-800">
                            {view === 'CLIENTS' ? 'Client Reports' :
                                view === 'REQUIREMENTS' ? 'Client Requirements' :
                                    'Requirement Analytics'}
                        </h1>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
                        Error: {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {view === 'CLIENTS' && renderClients()}
                        {view === 'REQUIREMENTS' && renderRequirements()}
                        {view === 'STATS' && renderStats()}
                    </>
                )}
            </main>
        </div>
    );
}
