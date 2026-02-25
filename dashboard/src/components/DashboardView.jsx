import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import AddAppModal from './AddAppModal'

export default function DashboardView({ userRole, userId }) {
    const navigate = useNavigate()
    const [apps, setApps] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchApps()
    }, [])

    const fetchApps = async () => {
        try {
            setLoading(true)
            let query = supabase.from('apps').select('*').order('created_at', { ascending: false })

            const { data, error } = await query

            if (error) {
                throw error
            }

            setApps(data || [])
        } catch (error) {
            console.error('Error fetching apps:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddNewApp = () => {
        setIsModalOpen(true)
    }

    const handleAppAdded = (newApp) => {
        // Optimistically update the list so we don't have to re-fetch
        setApps([newApp, ...apps])
    }

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Configured Applications</h2>
                {userRole === 'admin' && (
                    <button className="btn" onClick={handleAddNewApp}>
                        + Add New App
                    </button>
                )}
            </div>

            {loading ? (
                <p>Loading applications...</p>
            ) : apps.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No applications found.</p>
                    {userRole === 'admin' && <p>Click 'Add New App' to get started.</p>}
                </div>
            ) : (
                <div className="app-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {apps.map((app) => (
                        <div
                            key={app.id}
                            className="glass-card app-card"
                            onClick={() => navigate(`/app/${app.id}`)}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                        >
                            <h3>{app.name}</h3>
                            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{app.platform}</p>

                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>File</p>
                                <code style={{ color: 'var(--accent-color)', fontSize: '0.875rem' }}>{app.config_filename}</code>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn full-width" style={{ padding: '0.5rem' }}>
                                    Manage Controls
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AddAppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAppAdded={handleAppAdded}
            />
        </div>
    )
}
