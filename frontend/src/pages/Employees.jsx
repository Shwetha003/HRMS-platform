import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../lib/api';

const Employees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '', role: 'Employee', skills: '' });
    const [openActionId, setOpenActionId] = useState(null);

    const [userRole, setUserRole] = useState('Employee');

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/employees/me');
            setUserRole(res.data.profileType || res.data.role || 'Employee');
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        fetchEmployees();
    }, []);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const skillsArray = newEmp.skills.split(',').map(s => s.trim()).filter(s => s);
            await api.post('/employees', { ...newEmp, skills: skillsArray });
            setIsModalOpen(false);
            setNewEmp({ name: '', email: '', department: '', role: 'Employee', skills: '' });
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add employee');
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Are you sure you want to remove this employee from the organization?")) return;
        try {
            await api.delete(`/employees/${id}`);
            setOpenActionId(null);
            fetchEmployees();
        } catch (error) {
            alert('Failed to delete employee');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team Directory</h1>
                    <p className="text-slate-500 mt-1">Manage your organization's workforce</p>
                </div>
                {userRole === 'Admin' && (
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Employee
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 font-medium">Employee</th>
                                <th className="px-6 py-4 font-medium">Department</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Skills</th>
                                <th className="px-6 py-4 font-medium">Productivity</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading team members...</td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No employees found.</td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={emp.id}
                                        className="bg-white border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{emp.name}</div>
                                            <div className="text-slate-500 text-xs">{emp.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{emp.department || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {emp.skills?.slice(0, 3).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {emp.skills?.length > 3 && <span className="text-xs text-slate-400">+{emp.skills.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {emp.productivityScore !== null ? (
                                                    <>
                                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mr-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${emp.productivityScore >= 80 ? 'bg-emerald-500' : emp.productivityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${emp.productivityScore}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-semibold text-slate-700">{emp.productivityScore}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No tasks yet</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setOpenActionId(openActionId === emp.id ? null : emp.id)}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {openActionId === emp.id && (
                                                    <>
                                                        {/* Invisible overlay to catch clicks outside */}
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenActionId(null)}
                                                        ></div>
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, right: 30 }}
                                                            animate={{ opacity: 1, scale: 1, right: 40 }}
                                                            exit={{ opacity: 0, scale: 0.95, right: 30 }}
                                                            className="absolute top-10 right-10 z-20 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setOpenActionId(null);
                                                                    navigate(`/employees/${emp.id}`);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                            >
                                                                Edit Profile
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEmployee(emp.id)}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <Input required value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <Input required type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="john@company.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                        <Input value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} placeholder="Engineering" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newEmp.role}
                                            onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                                        >
                                            <option value="Employee">Employee</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label>
                                    <Input value={newEmp.skills} onChange={e => setNewEmp({ ...newEmp, skills: e.target.value })} placeholder="React, Node.js, Python" />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Add Team Member</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Employees;
