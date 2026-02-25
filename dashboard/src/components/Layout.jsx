import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Layout({ userEmail, userRole }) {
    const navigate = useNavigate()
    const location = useLocation()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="app-container">
            <header className="dashboard-header">
                <div>
                    <h1>AppConfigs Dashboard</h1>
                    <p>
                        Signed in as: {userEmail}{' '}
                        <span className="role-badge">{userRole || 'developer'}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {userRole === 'admin' && location.pathname !== '/developers' && (
                        <button className="btn-secondary" onClick={() => navigate('/developers')}>
                            Manage Users
                        </button>
                    )}
                    {userRole === 'admin' && location.pathname === '/developers' && (
                        <button className="btn-secondary" onClick={() => navigate('/')}>
                            Back to Dashboard
                        </button>
                    )}
                    <button onClick={handleSignOut} className="btn-secondary">
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Renders the matching child route component */}
            <main>
                <Outlet />
            </main>
        </div>
    )
}
