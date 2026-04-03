import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/AppContext';

const Header = ({
  title,
  subtitle,
  showBack = false,
  showNotification = false,
  rightAction,
  transparent = false,
}) => {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);

  // Pull live low-session alerts from global context
  const { getLowSessionPatients, getSessionsRemaining } = useAppStore();
  const lowPatients = getLowSessionPatients();
  const notifications = lowPatients.map((p) => ({
    id: p.id,
    patient: p,
    remaining: getSessionsRemaining(p),
    type: getSessionsRemaining(p) <= 0 ? 'danger' : 'warning',
  }));

  return (
    <>
      <header
        className={`
          sticky top-0 z-40 px-4
          ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-100'}
        `}
      >
        <div className="flex items-center gap-3 h-14">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {rightAction}
            {showNotification && (
              <button
                onClick={() => setShowPanel(true)}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notification slide-over panel */}
      {showPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowPanel(false)}
          />
          <div
            className="fixed top-0 h-full bg-white z-[70] shadow-2xl flex flex-col w-[320px]"
            style={{ right: 'max(0px, calc(50vw - 210px))' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                <p className="text-xs text-gray-500 mt-0.5">{notifications.length} alert{notifications.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-500">All clear!</p>
                  <p className="text-xs text-gray-400 mt-1">No session alerts right now</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { navigate(`/patients/${n.id}`); setShowPanel(false); }}
                    className={`
                      flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all active:scale-95
                      ${n.type === 'danger' ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'}
                    `}
                  >
                    <AlertTriangle
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${n.type === 'danger' ? 'text-danger-500' : 'text-warning-500'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{n.patient.name}</p>
                      <p className={`text-xs mt-0.5 ${n.type === 'danger' ? 'text-danger-600' : 'text-warning-600'}`}>
                        {n.remaining <= 0 ? 'Sessions exhausted!' : `Only ${n.remaining} session(s) left`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{n.patient.injury}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
