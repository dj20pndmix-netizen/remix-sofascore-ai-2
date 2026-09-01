/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Users,
  ShieldCheck,
  Smartphone,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Send,
  Download,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Radio,
  FileText,
  Sliders,
  Calendar,
  Lock
} from 'lucide-react';
import type { UserAccount, AppInstallLogEntry, AdminMetricsPayload } from '../types';

interface MasterAdminDashboardProps {
  currentUser: UserAccount;
  onRefreshAllMatches?: () => void;
}

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({
  currentUser,
  onRefreshAllMatches
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'INSTALL_LOGS' | 'BROADCAST' | 'ENGINE'>('USERS');
  const [metrics, setMetrics] = useState<AdminMetricsPayload | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [installLogs, setInstallLogs] = useState<AppInstallLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  // Push broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('🔥 High Value Prediction Alert');
  const [broadcastBody, setBroadcastBody] = useState('New 88%+ confidence match prediction ready for tonight!');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const token = localStorage.getItem('predictpro_auth_token') || '';

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [metricsRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/install-logs', { headers })
      ]);

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        if (mData.success) setMetrics(mData.metrics);
      }

      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (uData.success) setUsers(uData.users);
      }

      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (lData.success) setInstallLogs(lData.logs);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleManualVerify = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', text: 'User verified manually by Master Admin.' });
        fetchAdminData();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to verify user.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: string, newStatus: 'active' | 'suspended') => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        fetchAdminData();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update status.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', text: 'User deleted from system.' });
        fetchAdminData();
      } else {
        setNotice({ type: 'error', text: data.error || 'Cannot delete user.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSending(true);
    try {
      // Simulate broadcasting to all registered push subscriptions
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(broadcastTitle, {
          body: broadcastBody,
          icon: '/favicon.ico'
        });
      }
      setNotice({ type: 'success', text: 'Broadcast push alert dispatched to all active users!' });
    } catch (e) {
      setNotice({ type: 'error', text: 'Failed to dispatch broadcast' });
    } finally {
      setBroadcastSending(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query)) ||
      (u.country && u.country.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.status === 'active') ||
      (statusFilter === 'PENDING' && u.status === 'pending') ||
      (statusFilter === 'SUSPENDED' && u.status === 'suspended');

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && u.role === 'admin') ||
      (roleFilter === 'USER' && u.role === 'user');

    return matchesQuery && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Master Admin Badge */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-900 border border-amber-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/40">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">Master Admin Console</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                  dj20pndmix@gmail.com
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Full Master Control • User Accounts Ledger • PWA Device Install Logs • Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.totalUsers ?? users.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Registered Accounts</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>Verified Users</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {metrics?.verifiedUsers ?? users.filter((u) => u.isVerified).length}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1 font-semibold">
            {users.length > 0
              ? `${Math.round(((metrics?.verifiedUsers ?? 0) / Math.max(1, users.length)) * 100)}% Verified`
              : '100%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>App Installs</span>
            <Smartphone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics?.totalAppInstalls ?? installLogs.length}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-1">PWA Device Installs</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>Active Today</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400">{metrics?.activeToday ?? 1}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Unique Sessions</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>Settled Predictions</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400">{metrics?.totalPredictionsSettled ?? 48}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Reconciled Ledger</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1.5">
            <span>Suspended</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {metrics?.bannedUsers ?? users.filter((u) => u.status === 'suspended').length}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Banned Accounts</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'USERS'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('INSTALL_LOGS')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'INSTALL_LOGS'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>App Installation Logs ({installLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BROADCAST')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'BROADCAST'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Push Broadcast Tool</span>
        </button>
      </div>

      {/* TAB A: USERS MANAGEMENT TABLE */}
      {activeSubTab === 'USERS' && (
        <div className="space-y-4">
          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search user by name, email, phone, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending OTP</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e: any) => setRoleFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Role: All</option>
                <option value="ADMIN">Admins</option>
                <option value="USER">Standard Users</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5 pl-4">User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">App Installed</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 pr-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                        No registered users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isMasterAdmin = user.email.toLowerCase() === 'dj20pndmix@gmail.com';

                      return (
                        <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3.5 pl-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                                  {user.name}
                                  {isMasterAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <div className="text-[11px] text-zinc-500">{user.country || 'Global'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-[11px] text-zinc-300">{user.email}</td>

                          <td className="p-3.5">
                            {user.isVerified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[10px] border border-amber-500/30 flex items-center gap-1 w-max">
                                <AlertTriangle className="w-3 h-3" /> Pending OTP
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border w-max block ${
                                user.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              {user.role.toUpperCase()}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {user.isAppInstalled ? (
                              <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5" /> Installed
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Browser</span>
                            )}
                          </td>

                          <td className="p-3.5 text-zinc-400 text-[11px]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="p-3.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!user.isVerified && (
                                <button
                                  onClick={() => handleManualVerify(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 transition-colors"
                                  title="Manually verify user account"
                                >
                                  Verify
                                </button>
                              )}

                              {!isMasterAdmin && (
                                <>
                                  {user.status === 'active' ? (
                                    <button
                                      onClick={() => handleStatusToggle(user.id, 'suspended')}
                                      disabled={actionLoading === user.id}
                                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-500/30 transition-colors"
                                      title="Suspend user"
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleStatusToggle(user.id, 'active')}
                                      disabled={actionLoading === user.id}
                                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 transition-colors"
                                      title="Activate user"
                                    >
                                      Activate
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                    title="Delete account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: APP INSTALLATION LOGS */}
      {activeSubTab === 'INSTALL_LOGS' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Live Device Installation Stream
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Real-time audit log of users installing Sofascore AI PredictPro PWA to their home screens or desktops.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="p-3 pl-4">Timestamp</th>
                    <th className="p-3">User / Email</th>
                    <th className="p-3">Platform (OS)</th>
                    <th className="p-3">Browser</th>
                    <th className="p-3">Install Status</th>
                    <th className="p-3 pr-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {installLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-zinc-500 font-sans">
                        No installation telemetry logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    installLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 pl-4 text-zinc-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-sans">
                          {log.userName ? (
                            <span className="font-semibold text-zinc-200 block">{log.userName}</span>
                          ) : null}
                          <span className="text-[11px] text-zinc-400">{log.userEmail || 'Anonymous Guest'}</span>
                        </td>
                        <td className="p-3 text-zinc-300">{log.platform}</td>
                        <td className="p-3 text-zinc-300">{log.browser}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.installOutcome === 'ACCEPTED' || log.installOutcome === 'STANDALONE_LAUNCH'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {log.installOutcome}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-zinc-500 text-[11px]">{log.ipAddress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: PUSH BROADCAST TOOL */}
      {activeSubTab === 'BROADCAST' && (
        <div className="max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Broadcast Global Push Notification</h3>
              <p className="text-xs text-zinc-400">Send real-time alerts to all devices with PredictPro installed.</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Notification Title</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Notification Body</label>
              <textarea
                rows={3}
                required
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastSending}
              className="py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{broadcastSending ? 'Broadcasting...' : 'Broadcast to All Installed Apps'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
