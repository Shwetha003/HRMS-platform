import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, Mail, KeyRound, Wallet, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../lib/api';

const EmployeeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newPassword, setNewPassword] = useState('');
    const [pwdStatus, setPwdStatus] = useState({ loading: false, error: '', success: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await api.get(`/employees/${id}`);
                setEmployee(res.data);
            } catch (error) {
                console.error('Failed to fetch employee', error);
                alert("Failed to load employee details.");
                navigate('/employees');
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id, navigate]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setPwdStatus({ loading: true, error: '', success: '' });

        try {
            await api.put(`/employees/${id}/reset-password`, { newPassword });
            setPwdStatus({ loading: false, error: '', success: 'Password reset successfully!' });
            setNewPassword('');
            setTimeout(() => setPwdStatus(s => ({ ...s, success: '' })), 3000);
        } catch (error) {
            setPwdStatus({ loading: false, error: error.response?.data?.error || 'Failed to reset password', success: '' });
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/employees')}
                    className="mr-4 p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Details</h1>
                    <p className="text-slate-500 mt-1">Manage this employee's account and security</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row gap-8"
            >
                <div className="flex flex-col items-center md:items-start md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 pb-8 md:pb-0 md:pr-8">
                    <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <User className="w-16 h-16" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{employee?.name}</h2>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium mt-3 border border-slate-200 ${employee?.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {employee?.role}
                    </span>
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>
                        <div className="flex items-center text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <Mail className="w-5 h-5 mr-3 text-slate-400" />
                            {employee?.email}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Work Details</h3>
                        <div className="flex items-center text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <Briefcase className="w-5 h-5 mr-3 text-slate-400" />
                            {employee?.department || 'Not Assigned'}
                        </div>
                    </div>

                    {employee?.role !== 'Admin' && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Web3 Wallet</h3>
                            <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center">
                                    <Wallet className="w-5 h-5 mr-3 text-slate-400" />
                                    {employee?.walletAddress ? (
                                        <span className="font-mono text-sm font-medium">{employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}</span>
                                    ) : (
                                        <span className="text-sm text-slate-500">Not Connected</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {employee?.skills && employee.skills.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {employee.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6 mt-6 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                                <KeyRound className="w-4 h-4 mr-2 text-slate-500" />
                                Admin Controls
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 text-xs px-3 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                            >
                                {showPasswordForm ? 'Cancel' : 'Reset Password'}
                            </Button>
                        </div>

                        {showPasswordForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 border border-red-100 bg-red-50/50 rounded-xl">
                                <p className="text-xs text-red-600 mb-4 font-medium">As an admin, you can force reset this employee's password without needing their current password.</p>

                                {pwdStatus.error && <p className="text-sm text-red-500 mb-3 bg-red-100 p-2 rounded">{pwdStatus.error}</p>}
                                {pwdStatus.success && <p className="text-sm text-emerald-600 mb-3 bg-emerald-50 p-2 rounded">{pwdStatus.success}</p>}

                                <form onSubmit={handlePasswordReset} className="space-y-4 max-w-sm">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">New Password for {employee.name}</label>
                                        <Input
                                            type="password"
                                            required
                                            className="h-9 bg-white"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={pwdStatus.loading} className="w-full text-sm h-9 bg-red-600 hover:bg-red-700 text-white shadow-none">
                                        {pwdStatus.loading ? 'Resetting...' : 'Force Reset Password'}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EmployeeProfile;
