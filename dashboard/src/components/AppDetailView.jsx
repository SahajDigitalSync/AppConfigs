import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { fetchConfigFromGitHub, commitConfigToGitHub } from '../githubClient'
import AddControlModal from './AddControlModal'

export default function AppDetailView({ userRole }) {
    const { id } = useParams()
    const navigate = useNavigate()

    // Database State
    const [app, setApp] = useState(null)
    const [controls, setControls] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // GitHub State
    const [githubConfig, setGithubConfig] = useState(null)
    const [githubSha, setGithubSha] = useState(null)
    const [githubStatus, setGithubStatus] = useState('loading') // 'loading', 'success', 'error'

    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchAppDetails()
    }, [id])

    const fetchAppDetails = async () => {
        setLoading(true)
        setError(null)
        setGithubStatus('loading')
        try {
            // Fetch App Metadata
            const { data: appData, error: appError } = await supabase
                .from('apps')
                .select('*')
                .eq('id', id)
                .single()

            if (appError) throw appError

            // Fetch Controls
            const { data: controlsData, error: controlsError } = await supabase
                .from('app_controls')
                .select('*')
                .eq('app_id', id)
                .order('created_at', { ascending: true })

            if (controlsError) throw controlsError

            setApp(appData)
            setControls(controlsData || [])

            // Load GitHub Config (Do not block the whole page if GitHub fails)
            if (appData.config_filename) {
                fetchConfigFromGitHub(appData.config_filename)
                    .then(payload => {
                        setGithubConfig(payload.content)
                        setGithubSha(payload.sha)
                        setGithubStatus('success')
                    })
                    .catch(err => {
                        console.error("GitHub Error:", err)
                        setGithubStatus('error')
                    })
            } else {
                setGithubStatus('error')
            }

        } catch (err) {
            console.error(err)
            setError("Failed to load application details.")
        } finally {
            setLoading(false)
        }
    }

    const handleControlAdded = (newControl) => {
        setControls([...controls, newControl])
    }

    // Helper function to resolve nested JSON keys safely (e.g. "ads.banner")
    const resolveValuePath = (obj, path) => {
        if (!obj || !path) return undefined
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj)
    }

    if (loading) return <p>Loading application details...</p>
    if (error) return <p className="auth-message">{error}</p>
    if (!app) return <p>Application not found.</p>

    return (
        <div className="dashboard-content">
            <button className="text-btn" onClick={() => navigate('/')} style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                &larr; Back to Apps
            </button>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ marginBottom: '0.5rem' }}>{app.name}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span className="role-badge" style={{ margin: 0 }}>{app.platform}</span>
                            {app.app_url && (
                                <a href={app.app_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontSize: '0.875rem' }}>
                                    View in Store
                                </a>
                            )}
                        </div>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GitHub Config File</p>
                        <code style={{ color: 'var(--accent-color)', fontSize: '0.875rem' }}>{app.config_filename}</code>
                        {githubStatus === 'success' && <span style={{ display: 'block', fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>File Synchronized &bull; Live</span>}
                        {githubStatus === 'error' && <span style={{ display: 'block', fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>Error Loading Synced File</span>}
                        {githubStatus === 'loading' && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Fetching from GitHub...</span>}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Configuration Controls</h3>
                {userRole === 'admin' && (
                    <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
                        + Add Control (Ad Unit)
                    </button>
                )}
            </div>

            {controls.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No configuration controls created yet.</p>
                    {userRole === 'admin' && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Click 'Add Control' to define an editable section of your JSON config.</p>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {controls.map(control => {
                        const currentValue = githubStatus === 'success' ? resolveValuePath(githubConfig, control.key_name) : undefined;

                        return (
                            <div key={control.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{control.name}</h4>
                                </div>
                                {control.description && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{control.description}</p>
                                )}

                                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Live Value (From GitHub)</p>
                                    {githubStatus === 'loading' ? (
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading...</span>
                                    ) : currentValue !== undefined ? (
                                        <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                            {typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : String(currentValue)}
                                        </pre>
                                    ) : (
                                        <span style={{ fontSize: '0.875rem', color: '#F59E0B' }}>Not found in {app.config_filename}</span>
                                    )}
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>JSON Key: {control.key_name}</code>
                                    <button className="text-btn" disabled={githubStatus !== 'success'}>Configure</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <AddControlModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                appId={app.id}
                onControlAdded={handleControlAdded}
            />
        </div>
    )
}
