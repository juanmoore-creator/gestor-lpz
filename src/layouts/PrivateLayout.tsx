import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, FolderOpen, Users, CalendarDays } from 'lucide-react';


const PrivateLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Removed unused handleNewValuation destructuring since the button was removed

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/app')}
                    >
                        <div className="bg-brand p-1.5 rounded-lg">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading font-bold text-xl text-gray-800">
                            Lopez <span className="text-brand">Bienes Raíces</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">

                        <button onClick={() => navigate('/app/tasaciones')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Tasaciones</span>
                        </button>

                        <button onClick={() => navigate('/app/clients')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <Users className="w-4 h-4" /> <span className="hidden sm:inline">Clientes</span>
                        </button>

                        <button onClick={() => navigate('/app/archivos')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Archivos</span>
                        </button>

                        <button onClick={() => navigate('/app/calendar')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                            <CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">Calendario</span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-1"></div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors p-2 rounded-lg hover:bg-gray-100"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>


        </div>
    );
};

export default PrivateLayout;
