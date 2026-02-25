import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Activity } from 'lucide-react';
import api from '../lib/api';

const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/dashboard/metrics');
                setMetrics(res.data);
            } catch (error) {
                console.error('Failed to fetch metrics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Employees',
            value: metrics?.totalEmployees || 0,
            icon: Users,
            color: 'bg-blue-50 text-blue-600 border-blue-200',
            iconBg: 'bg-blue-100'
        },
        {
            label: 'Active Employees',
            value: metrics?.activeEmployees || 0,
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            iconBg: 'bg-emerald-100'
        },
        {
            label: 'Completed Tasks',
            value: metrics?.tasks?.completed || 0,
            icon: CheckCircle,
            color: 'bg-purple-50 text-purple-600 border-purple-200',
            iconBg: 'bg-purple-100'
        },
        {
            label: 'In Progress Tasks',
            value: metrics?.tasks?.inProgress || 0,
            icon: Clock,
            color: 'bg-amber-50 text-amber-600 border-amber-200',
            iconBg: 'bg-amber-100'
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
                <p className="text-slate-500 mt-1">Monitor your workforce and task productivity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-2xl border p-6 shadow-sm flex flex-col relative overflow-hidden bg-white ${stat.color}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold tracking-tight mb-1">{stat.value}</h3>
                            <p className="text-sm font-medium opacity-80">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-6">Productivity Score</h3>
                <div className="flex items-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray="351.858"
                                strokeDashoffset={351.858 - (351.858 * (metrics?.productivityScore || 0)) / 100}
                                className="text-blue-600 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800">{metrics?.productivityScore || 0}%</span>
                        </div>
                    </div>
                    <div className="ml-8 space-y-2">
                        <p className="text-slate-600">
                            Your organization's overall task completion rate.
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                            <span className="text-blue-600">{metrics?.tasks?.completed}</span> of {metrics?.tasks?.total} tasks completed
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
