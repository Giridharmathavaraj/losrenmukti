'use client';

import React, { useState } from 'react';
import { useNavigate } from '@/Component/router-hooks';
import Nav from '../Nav';
import { getApiUrl } from '../../apiConfig';
import '../New Users/RecordForm.css';

const AddCompany = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        status: 'enable'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(getApiUrl('/api/companies'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create company');
            }

            alert('Company successfully created!');
            navigate('/companies');

        } catch (error) {
            console.error('Error saving company:', error);
            alert('Error: ' + error.message);
        }
    };

    return (
        <>
            <Nav />
            <div className="container">
                <div className="form-section">
                    <h2>Create New Company</h2>
                    <form onSubmit={handleSubmit} className="record-form">
                        <div className="form-group">
                            <label htmlFor="name">Company Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter company name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contactEmail">Contact Email</label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                placeholder="Enter contact email (optional)"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="enable">Enable</option>
                                <option value="disable">Disable</option>
                            </select>
                        </div>

                        <button type="submit" className="submit-btn" style={{ marginLeft: 0 }}>
                            Create Company
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddCompany;
