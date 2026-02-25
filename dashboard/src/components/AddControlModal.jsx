import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AddControlModal({ isOpen, onClose, appId, onControlAdded }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // Form State
    const [name, setName] = useState('')
    const [keyName, setKeyName] = useState('')
    const [description, setDescription] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const { data, error } = await supabase
                .from('app_controls')
                .insert([
                    {
                        app_id: appId,
                        name,
                        key_name: keyName,
                        description
                    }
                ])
                .select()

            if (error) throw error

            // Success
            setName('')
            setKeyName('')
            setDescription('')

            if (onControlAdded) onControlAdded(data[0])
            onClose()

        } catch (error) {
            console.error(error)
            setMessage(error.message || 'Error adding control.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Add New Config Control</h3>
                    <button className="text-btn" onClick={onClose} style={{ fontSize: '1.2rem' }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Control Name *</label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>e.g., Main Banner Ad, Level 1 Difficulty</p>
                        <input
                            id="name"
                            type="text"
                            placeholder="Display name for this setting"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="keyName">JSON Key Path *</label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>The exact object key in the JSON file. Use dot notation for nested keys (e.g., `ads.main_banner`).</p>
                        <input
                            id="keyName"
                            type="text"
                            placeholder="e.g. ad_units.main_banner"
                            value={keyName}
                            required
                            onChange={(e) => setKeyName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            id="description"
                            placeholder="Details about what this controls..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }}
                            rows={3}
                        />
                    </div>

                    {message && <p className="auth-message">{message}</p>}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn-secondary full-width" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn full-width" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Control'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
