import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Layout from './components/Layout'
import DashboardView from './components/DashboardView'
import DevelopersView from './components/DevelopersView'
import AppDetailView from './components/AppDetailView'

function App() {
    const [session, setSession] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) fetchUserRole(session.user.id)
            else setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) fetchUserRole(session.user.id)
            else {
                setUserRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserRole = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single()

            if (!error && data) {
                setUserRole(data.role)
            }
        } catch (err) {
            console.error("Error fetching user role:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading application...</p>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                {/* Public Login Route */}
                <Route
                    path="/login"
                    element={!session ? <Login /> : <Navigate to="/" replace />}
                />

                {/* Protected Dashboard Routes */}
                <Route
                    element={
                        session ? (
                            <Layout userEmail={session.user.email} userRole={userRole} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                >
                    <Route path="/" element={<DashboardView userRole={userRole} userId={session?.user?.id} />} />
                    <Route path="/app/:id" element={<AppDetailView userRole={userRole} />} />
                    <Route path="/developers" element={userRole === 'admin' ? <DevelopersView /> : <Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
