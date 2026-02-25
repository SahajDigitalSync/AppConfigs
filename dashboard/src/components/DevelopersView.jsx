import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function DevelopersView() {
    const [users, setUsers] = useState([])
    const [apps, setApps] = useState([])
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
            if (usersError) throw usersError

            // Fetch apps
            const { data: appsData, error: appsError } = await supabase
                .from('apps')
                .select('*')
                .order('name', { ascending: true })
            if (appsError) throw appsError

            // Fetch permissions
            const { data: permsData, error: permsError } = await supabase
                .from('app_permissions')
                .select('*')
            if (permsError) throw permsError

            setUsers(usersData || [])
            setApps(appsData || [])
            setPermissions(permsData || [])
        } catch (err) {
            console.error(err)
            setError("Failed to load user management data.")
        } finally {
            setLoading(false)
        }
    }

    const handleTogglePermission = async (userId, appId, hasPermission, permissionId) => {
        try {
            if (hasPermission) {
                // Remove permission
                const { error } = await supabase
                    .from('app_permissions')
                    .delete()
                    .eq('id', permissionId)
                if (error) throw error

                // Optimistic update
                setPermissions(permissions.filter(p => p.id !== permissionId))
            } else {
                // Add permission
                const { data, error } = await supabase
                    .from('app_permissions')
                    .insert([{ user_id: userId, app_id: appId }])
                    .select()
                if (error) throw error

                // Optimistic update
                if (data && data.length > 0) {
                    setPermissions([...permissions, data[0]])
                }
            }
        } catch (err) {
            console.error("Error toggling permission:", err)
            alert("Failed to update permission.")
        }
    }

    if (loading) return <p>Loading user management...</p>
    if (error) return <p className="auth-message">{error}</p>

    // Filter out admins from the list so we only manage developers
    const developers = users.filter(u => u.role !== 'admin')

    return (
        <div className="dashboard-content">
            <div style={{ marginBottom: '2rem' }}>
                <h2>Manage Developers</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Assign developers access to specific configuration files.</p>
            </div>

            {developers.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No developers found.</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        To add a developer, create their account in the Supabase Dashboard Authentication section.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {developers.map(dev => (
                        <div key={dev.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0 }}>{dev.email}</h3>
                                <span className="role-badge" style={{ margin: 0 }}>{dev.role}</span>
                            </div>

                            <div>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: 600 }}>App Permissions:</p>
                                {apps.length === 0 ? (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No apps exist yet.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {apps.map(app => {
                                            const permission = permissions.find(p => p.user_id === dev.id && p.app_id === app.id)
                                            const hasPermission = !!permission

                                            return (
                                                <label
                                                    key={app.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        backgroundColor: hasPermission ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        border: hasPermission ? '1px solid var(--accent-color)' : '1px solid transparent',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={hasPermission}
                                                        onChange={() => handleTogglePermission(dev.id, app.id, hasPermission, permission?.id)}
                                                        style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
                                                    />
                                                    <span style={{ fontSize: '0.875rem', userSelect: 'none' }}>{app.name}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
