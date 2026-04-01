'use client';

import React, { useState, useEffect } from 'react';
import Nav from '../Nav';
import { getApiUrl } from '../../apiConfig';

import { UserCircle } from 'lucide-react';
import { useLocation, useNavigate } from '@/Component/router-hooks';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const currentUserRole = localStorage.getItem('role') || '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editUserId, setEditUserId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        role: '',
        status: '',
        companyId: ''
    });
    const navigate = useNavigate();

    const handleEditClick = (user) => {
        setEditUserId(user._id);
        const formValues = {
            role: user.role || 'users',
            status: user.status || 'enable',
            companyId: user.companyId?._id || ''
        };
        setEditFormData(formValues);
    };

    const handleCancelClick = () => {
        setEditUserId(null);
    };

    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async (userId) => {
        try {
            const response = await fetch(getApiUrl(`/api/users/${userId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editFormData),
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            const updatedUser = await response.json();

            const newUsers = users.map((u) =>
                u._id === userId ? {
                    ...u,
                    role: updatedUser.role,
                    status: updatedUser.status,
                    companyId: updatedUser.companyId
                } : u
            );
            setUsers(newUsers);
            setEditUserId(null);
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        const fetchUsersAndCompanies = async () => {
            try {
                const [usersRes, companiesRes] = await Promise.all([
                    fetch(getApiUrl('/api/users'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                    fetch(getApiUrl('/api/companies'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                ]);

                if (!usersRes.ok || !companiesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const usersData = await usersRes.json();
                const companiesData = await companiesRes.json();

                setUsers(usersData);
                setCompanies(companiesData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUsersAndCompanies();
    }, []);

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <Nav />
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                    <UserCircle size={32} color="#4a90e2" />
                    <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>System Users </h2>
                    <button onClick={() => navigate('/Addusers')} style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: 'auto' }}>Add User</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading users...</div>
                ) : error ? (
                    <div style={{ backgroundColor: '#fee', color: '#c00', padding: '15px', borderRadius: '8px', border: '1px solid #fcc' }}>
                        <strong>Error:</strong> {error}
                    </div>
                ) : (
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eaeaea' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f4f7f6', borderBottom: '2px solid #eaeaea' }}>
                                <tr>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>ID</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Username</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Company</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Role</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Created Date</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid #eaeaea', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        <td style={{ padding: '16px 20px', color: '#666', fontSize: '14px', fontFamily: 'monospace' }}>{user._id}</td>
                                        <td style={{ padding: '16px 20px', color: '#333', fontSize: '15px', fontWeight: '500' }}>{user.username}</td>

                                        {editUserId === user._id ? (
                                            <>
                                                <td style={{ padding: '16px 20px' }}>
                                                    {currentUserRole === 'superadmin' ? (
                                                        <select
                                                            name="companyId"
                                                            value={editFormData.companyId}
                                                            onChange={handleEditFormChange}
                                                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        >
                                                            <option value="">No Company</option>
                                                            {companies.map(c => (
                                                                <option key={c._id} value={c._id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span style={{ color: '#333', fontSize: '14px' }}>{user.companyId?.name || 'N/A'}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <select
                                                        name="role"
                                                        value={editFormData.role}
                                                        onChange={handleEditFormChange}
                                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="users">User</option>
                                                        <option value="admin">Admin</option>
                                                        {currentUserRole === 'superadmin' && (
                                                            <option value="superadmin">Super Admin</option>
                                                        )}
                                                    </select>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <select
                                                        name="status"
                                                        value={editFormData.status}
                                                        onChange={handleEditFormChange}
                                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    >
                                                        <option value="enable">Enable</option>
                                                        <option value="disable">Disable</option>
                                                    </select>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '16px 20px', color: '#333', fontSize: '14px' }}>{user.companyId?.name || 'N/A'}</td>
                                                <td style={{ padding: '16px 20px', color: '#666', fontSize: '14px', textTransform: 'capitalize' }}>{user.role || 'users'}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: (user.status || 'enable') === 'enable' ? '#e6f4ea' : '#fce8e6',
                                                        color: (user.status || 'enable') === 'enable' ? '#1e8e3e' : '#d93025'
                                                    }}>
                                                        {(user.status || 'enable').toUpperCase()}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        <td style={{ padding: '16px 20px', color: '#666', fontSize: '14px' }}>
                                            {user.createdAt ? (
                                                <>{new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                            ) : 'N/A'}
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            {editUserId === user._id ? (
                                                <>
                                                    <button onClick={() => handleSaveClick(user._id)} style={{ padding: '6px 12px', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Save</button>
                                                    <button onClick={handleCancelClick} style={{ padding: '6px 12px', backgroundColor: '#f1f3f4', color: '#333', border: '1px solid #dcdcdc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleEditClick(user)} style={{ padding: '6px 12px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No users found in the system.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;