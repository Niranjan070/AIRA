import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Microscope, 
  FileText, 
  Settings,
  DollarSign,
  Shield,
  AlertTriangle,
  TrendingUp,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgents } from '@/contexts/AgentContext';

const navigation = [
  { name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analysis Workspace', href: '/workspace', icon: Microscope },
  { name: 'Strategic Reports', href: '/reports', icon: FileText }
];

const agentIcons = {
  finance: DollarSign,
  risk: Shield,
  compliance: AlertTriangle,
  market: TrendingUp
};

const statusColors = {
  active: 'bg-green-500',
  analyzing: 'bg-yellow-500',
  inactive: 'bg-gray-400'
};

export function Sidebar() {
  const location = useLocation();
  const { agents } = useAgents();

  return (
    <div className="w-64 glass-dark h-screen flex flex-col border-r-2 border-white/10 overflow-hidden">
      {/* Logo & Title */}
      <div className="p-6 border-b-2 border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden bg-white/10">
            <img 
              src="/Screenshot 2025-09-02 102251.png" 
              alt="AIRA Logo" 
              className="w-10 h-10 object-contain rounded-lg"
            />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white">AIRA</h1>
            <p className="text-xs text-gray-300">AI DECISION ECOSYSTEM</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Navigation
          </h3>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative group",
                  isActive 
                    ? "accent-button text-white shadow-lg" 
                    : "text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 accent-button rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                <span className="font-medium relative z-10 group-hover:scale-105 transition-transform">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Agent Status List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            AI Agents Status
          </h3>
          <div className="space-y-3">
            {agents.map((agent) => {
              const Icon = agentIcons[agent.id as keyof typeof agentIcons];
              
              return (
                <div key={agent.id} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-transparent hover:border-white/20">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors group-hover:scale-110" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{agent.name} Agent</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
                    <div className={cn("w-3 h-3 rounded-full shadow-sm transition-all duration-300 group-hover:scale-110", statusColors[agent.status])} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Enterprise Admin</p>
            <p className="text-xs text-gray-400">Strategic Decision Maker</p>
          </div>
        </div>
      </div>
    </div>
  );
}