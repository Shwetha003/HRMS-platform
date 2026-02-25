import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BrainCircuit, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../lib/api';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', skillsRequired: '' });

    const [userRole, setUserRole] = useState('Employee');

    // AI Feature States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
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
        fetchTasks();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/tasks/${id}`, { status });
            fetchTasks();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleGetAiRecommendations = async () => {
        if (!newTask.skillsRequired) return alert('Enter required skills first!');

        setIsAiLoading(true);
        setAiRecommendations([]);
        setSelectedAssignee('');

        try {
            const skillsArray = newTask.skillsRequired.split(',').map(s => s.trim()).filter(s => s);
            const res = await api.post('/ai/recommend-assignee', { skillsRequired: skillsArray });
            setAiRecommendations(res.data.recommendations);

            if (res.data.recommendations.length > 0) {
                setSelectedAssignee(res.data.recommendations[0].employeeId);
            }
        } catch (error) {
            alert('Failed to get AI recommendations');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!selectedAssignee) return alert('Please select an assignee from recommendations');

        try {
            const skillsArray = newTask.skillsRequired.split(',').map(s => s.trim()).filter(s => s);
            await api.post('/tasks', {
                ...newTask,
                skillsRequired: skillsArray,
                assignedTo: selectedAssignee
            });
            setIsModalOpen(false);
            setNewTask({ title: '', description: '', skillsRequired: '' });
            setAiRecommendations([]);
            setSelectedAssignee('');
            fetchTasks();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create task');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return <CheckCircle2 className="w-4 h-4 text-purple-600 mr-2" />;
            case 'In Progress': return <PlayCircle className="w-4 h-4 text-blue-600 mr-2" />;
            default: return <Clock className="w-4 h-4 text-amber-600 mr-2" />;
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'Completed': return 'bg-purple-50 border-purple-200';
            case 'In Progress': return 'bg-blue-50 border-blue-200';
            default: return 'bg-amber-50 border-amber-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Assign and track workforce progress</p>
                </div>
                {userRole === 'Admin' && (
                    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Assign Task
                    </Button>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                {/* Kanban style columns */}
                {['Assigned', 'In Progress', 'Completed'].map(columnStatus => (
                    <div key={columnStatus} className="flex flex-col h-full bg-slate-100 rounded-2xl p-4 border border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center justify-between">
                            {columnStatus}
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                                {tasks.filter(t => t.status === columnStatus).length}
                            </span>
                        </h3>

                        <div className="flex flex-col gap-3 overflow-y-auto">
                            <AnimatePresence>
                                {tasks.filter(t => t.status === columnStatus).map(task => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={task.id}
                                        className={`bg-white p-4 rounded-xl border shadow-sm ${getStatusBg(task.status)}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-slate-900">{task.title}</h4>
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {task.skillsRequired?.map((skill, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200/60">
                                            <div className="flex items-center text-xs font-medium text-slate-600">
                                                {getStatusIcon(task.status)}
                                                {task.status}
                                            </div>

                                            <div className="flex space-x-1">
                                                {task.status === 'Assigned' && (
                                                    <button onClick={() => handleUpdateStatus(task.id, 'In Progress')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium transition-colors">Start</button>
                                                )}
                                                {task.status === 'In Progress' && (
                                                    <button onClick={() => handleUpdateStatus(task.id, 'Completed')} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-medium transition-colors">Complete</button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {tasks.filter(t => t.status === columnStatus).length === 0 && (
                                <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm">
                                    No tasks here
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
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
                            className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                    <BrainCircuit className="w-5 h-5 mr-2 text-blue-600" />
                                    Smart Task Assignment
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form id="taskForm" onSubmit={handleCreateTask} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                                        <Input required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Deploy new microservice" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            required
                                            className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                            placeholder="Details about what needs to be done..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Skills Required (comma separated)</label>
                                        <div className="flex space-x-2">
                                            <Input required value={newTask.skillsRequired} onChange={e => setNewTask({ ...newTask, skillsRequired: e.target.value })} placeholder="Docker, Kubernetes, AWS" />
                                            <Button type="button" onClick={handleGetAiRecommendations} disabled={isAiLoading || !newTask.skillsRequired} className="bg-slate-900 text-white hover:bg-slate-800 shrink-0">
                                                {isAiLoading ? 'Analyzing...' : 'Get AI Matches'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>

                                {/* AI Recommendations Area */}
                                {aiRecommendations.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                                            <BrainCircuit className="w-4 h-4 mr-2 text-blue-600" />
                                            AI Recommended Assignees
                                        </h4>
                                        <div className="space-y-3">
                                            {aiRecommendations.map((emp, index) => (
                                                <div
                                                    key={emp.employeeId}
                                                    onClick={() => setSelectedAssignee(emp.employeeId)}
                                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedAssignee === emp.employeeId
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-slate-200 hover:border-blue-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                                                            #{index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-sm">{emp.name}</p>
                                                            <p className="text-xs text-slate-500">{emp.department} • {emp.activeTasksCount} active tasks</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-medium text-slate-500 mb-1">Match Score</p>
                                                        <div className="flex items-center">
                                                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mr-2 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-600 rounded-full"
                                                                    style={{ width: `${Math.min(100, Math.max(0, emp.score * 10))}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{emp.score} pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" form="taskForm" disabled={!selectedAssignee} className={!selectedAssignee ? 'opacity-50' : ''}>
                                    Create & Assign Task
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tasks;
