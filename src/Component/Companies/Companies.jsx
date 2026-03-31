import React, { useState, useEffect } from 'react';
import Nav from '../Nav';
import { getApiUrl } from '../../apiConfig';
import { Building2 } from 'lucide-react';
import { useNavigate } from '@/Component/router-hooks';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editCompanyId, setEditCompanyId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        contactEmail: '',
        status: ''
    });
    const navigate = useNavigate();

    const fetchCompanies = async () => {
        try {
            const response = await fetch(getApiUrl('/api/companies'), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch companies');
            const data = await response.json();
            setCompanies(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleEditClick = (company) => {
        setEditCompanyId(company._id);
        setEditFormData({
            name: company.name,
            contactEmail: company.contactEmail || '',
            status: company.status || 'enable'
        });
    };

    const handleCancelClick = () => {
        setEditCompanyId(null);
    };

    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async (companyId) => {
        try {
            const response = await fetch(`/api/companies/${companyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editFormData),
            });

            if (!response.ok) throw new Error('Failed to update company');

            const updatedCompany = await response.json();
            setCompanies(companies.map((c) => c._id === companyId ? updatedCompany : c));
            setEditCompanyId(null);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <Nav />
            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                    <Building2 size={32} color="#4a90e2" />
                    <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>Companies</h2>
                    <button onClick={() => navigate('/add-company')} style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: 'auto' }}>Add Company</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading companies...</div>
                ) : error ? (
                    <div style={{ backgroundColor: '#fee', color: '#c00', padding: '15px', borderRadius: '8px', border: '1px solid #fcc' }}>
                        <strong>Error:</strong> {error}
                    </div>
                ) : (
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eaeaea' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f4f7f6', borderBottom: '2px solid #eaeaea' }}>
                                <tr>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Name</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Contact Email</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                    <th style={{ padding: '16px 20px', color: '#555', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company, index) => (
                                    <tr key={company._id} style={{ borderBottom: '1px solid #eaeaea', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        {editCompanyId === company._id ? (
                                            <>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} style={{ padding: '6px', width: '100%' }} />
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <input type="email" name="contactEmail" value={editFormData.contactEmail} onChange={handleEditFormChange} style={{ padding: '6px', width: '100%' }} />
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <select name="status" value={editFormData.status} onChange={handleEditFormChange} style={{ padding: '6px' }}>
                                                        <option value="enable">Enable</option>
                                                        <option value="disable">Disable</option>
                                                    </select>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '16px 20px', color: '#333', fontSize: '15px', fontWeight: '500' }}>{company.name}</td>
                                                <td style={{ padding: '16px 20px', color: '#666', fontSize: '14px' }}>{company.contactEmail || 'N/A'}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                                        backgroundColor: company.status === 'enable' ? '#e6f4ea' : '#fce8e6',
                                                        color: company.status === 'enable' ? '#1e8e3e' : '#d93025'
                                                    }}>{(company.status || 'enable').toUpperCase()}</span>
                                                </td>
                                            </>
                                        )}
                                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                            {editCompanyId === company._id ? (
                                                <>
                                                    <button onClick={() => handleSaveClick(company._id)} style={{ padding: '6px 12px', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Save</button>
                                                    <button onClick={handleCancelClick} style={{ padding: '6px 12px', backgroundColor: '#f1f3f4', color: '#333', border: '1px solid #dcdcdc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleEditClick(company)} style={{ padding: '6px 12px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {companies.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No companies found.</td>
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

export default Companies;
