import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, CheckSquare, LogOut, User as UserIcon } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const orgName = localStorage.getItem('orgId') ? 'Acme Corp' : 'Workspace'; // Normally fetch from profile

    const [userRole, setUserRole] = useState('Employee');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchRole = async () => {
            try {
                // To fetch from the layout without breaking the session, check token scope or a lightweight me endpoint.
                const token = localStorage.getItem('token');
                if (!token) return;

                // For simplicity, we can fetch once or decode the JWT
                const res = await fetch('http://localhost:5000/api/employees/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const role = data.profileType || data.role || 'Employee';
                setUserRole(role);
                setUserName(data.name || 'Admin');

                // Redirect employees away from dashboard to their profile
                if (role !== 'Admin' && location.pathname === '/dashboard') {
                    navigate('/profile', { replace: true });
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchRole();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('orgId');
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Employees', icon: Users, path: '/employees' },
        { name: 'Profile', icon: Users, path: '/profile' },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="flex items-center h-16 px-6 border-b border-slate-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 font-bold text-lg">
                        A
                    </div>
                    <span className="font-semibold text-lg tracking-tight">AI-HRMS</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Menu</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        // Role-Based UI Filtering
                        if (userRole !== 'Admin' && (item.name === 'Dashboard' || item.name === 'Employees')) return null;
                        if (userRole === 'Admin' && item.name === 'Profile') return null;

                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-3 py-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
                    <h2 className="text-lg font-semibold text-slate-800 capitalize">
                        {location.pathname.split('/')[1] || 'Dashboard'}
                    </h2>
                    <div className="flex items-center relative z-50">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600 flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {userName ? userName.substring(0, 2).toUpperCase() : 'AD'}
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 flex flex-col py-1"
                                    >
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                                            <p className="text-xs text-slate-500 truncate">{userRole}</p>
                                        </div>

                                        {userRole === 'Employee' && (
                                            <button
                                                onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                                                className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <UserIcon className="w-4 h-4 mr-3 text-slate-400" />
                                                My Profile
                                            </button>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-slate-100"
                                        >
                                            <LogOut className="w-4 h-4 mr-3 text-red-400" />
                                            Sign out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
