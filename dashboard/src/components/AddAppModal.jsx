import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AddAppModal({ isOpen, onClose, onAppAdded }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Form State
    const [name, setName] = useState('')
    const [platform, setPlatform] = useState('Android')
    const [appUrl, setAppUrl] = useState('')
    const [configFilename, setConfigFilename] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const { data, error } = await supabase
                .from('apps')
                .insert([
                    {
                        name,
                        platform,
                        app_url: appUrl,
                        config_filename: configFilename
                    }
                ])
                .select()

            if (error) throw error

            // Success
            setName('')
            setAppUrl('')
            setConfigFilename('')
            setPlatform('Android')

            if (onAppAdded) onAppAdded(data[0])
            onClose()

        } catch (error) {
            console.error(error)
            setMessage(error.message || 'Error adding application.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Add New App</h3>
                    <button className="text-btn" onClick={onClose} style={{ fontSize: '1.2rem' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">App Name *</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="e.g. Connect 3D"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="platform">Platform *</label>
                        <select
                            id="platform"
                            className="styled-select"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                        >
                            <option value="Android">Android</option>
                            <option value="iOS">iOS</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="appUrl">App Store / Play Store URL</label>
                        <input
                            id="appUrl"
                            type="url"
                            placeholder="https://play.google.com/store/apps/details?id=..."
                            value={appUrl}
                            onChange={(e) => setAppUrl(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="configFilename">GitHub Config Filename *</label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>The exact name of the file in the /configs repository directory.</p>
                        <input
                            id="configFilename"
                            type="text"
                            placeholder="e.g. connect_3d.json"
                            value={configFilename}
                            required
                            onChange={(e) => setConfigFilename(e.target.value)}
                        />
                    </div>

                    {message && <p className="auth-message">{message}</p>}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn-secondary full-width" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn full-width" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
