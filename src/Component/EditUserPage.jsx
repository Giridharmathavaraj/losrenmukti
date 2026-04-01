'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';
import { useLocation, useNavigate } from '@/Component/router-hooks';
import './EditUserPage.css';

function EditUserPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loanData } = location.state || {}; // Access passed state

    // Helper to format Date for input[type="date"] (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            return d.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const [formData, setFormData] = useState({
        firstName: loanData?.firstName || '',
        lastName: loanData?.lastName || '',
        email: loanData?.email || '',
        phone: loanData?.phone || loanData?.mobile || '',
        dateOfBirth: formatDate(loanData?.dateOfBirth) || '',
        gender: loanData?.gender || '',
        social_Security_Code: loanData?.social_Security_Code || loanData?.ssn || '',

        Primary_Address: loanData?.Primary_Address || loanData?.address || '',
        Primary_Address_State: loanData?.Primary_Address_State || loanData?.state || '',
        Primary_Address_Zip_Code: loanData?.Primary_Address_Zip_Code || loanData?.zipCode || '',
        Primary_Address_Country: loanData?.Primary_Address_Country || 'US Citizen',

        Request_Loan_Amount: loanData?.Request_Loan_Amount || '',
        loanPurpose: loanData?.loanPurpose || 'Debt Consolidation',
        citizenshipStatus: loanData?.citizenshipStatus || '',

        selfEmployee: loanData?.selfEmployee || 'Yes',
        income: loanData?.income || loanData?.annualIncome || '',
        hireDate: formatDate(loanData?.hireDate) || '',
        cCompanyName: loanData?.cCompanyName || '',
        cCity: loanData?.cCity || '',
        cZipCode: loanData?.cZipCode || '',
        cCountry: loanData?.cCountry || 'US Citizen',
    });

    const [availableStates, setAvailableStates] = useState([]);
    const [showOtherState, setShowOtherState] = useState(false);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await fetch(getApiUrl('/api/states'), {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const approved = data.filter(s => s.status === 'Approved');
                    setAvailableStates(approved);

                    // If existing state is not in the approved list, show the "Other" input
                    if (formData.Primary_Address_State && !approved.some(s => s.name === formData.Primary_Address_State)) {
                        setShowOtherState(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching states:", error);
            }
        };
        fetchStates();
    }, []);

    const handleStateChange = (e) => {
        const value = e.target.value;
        if (value === "Others") {
            setShowOtherState(true);
            setFormData(prev => ({ ...prev, Primary_Address_State: "" }));
        } else {
            setShowOtherState(false);
            setFormData(prev => ({ ...prev, Primary_Address_State: value }));
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update loan');
            }

            const updatedLoan = await response.json();
            console.log('Loan updated:', updatedLoan);

            // Navigate back with the UPDATED loan data from the server response
            navigate('/particular-loan', { state: { loanData: updatedLoan } });

        } catch (err) {
            console.error("Error updating loan:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    if (!loanData) {
        return <div>No customer selected. <button onClick={() => navigate('/')}>Back</button></div>;
    }

    return (
        <div className="edit-user-container">
            <div className="edit-card">
                <div className="edit-header">
                    <h1>Edit Customer</h1>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}

                <form className="edit-form" onSubmit={(e) => e.preventDefault()}>

                    {/* Personal Information */}
                    <div className="section-header">Personal Information</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" name="email" className="form-control" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input type="tel" id="phone" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input type="date" id="dateOfBirth" name="dateOfBirth" className="form-control" value={formData.dateOfBirth} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="social_Security_Code">SSN</label>
                            <input type="text" id="social_Security_Code" name="social_Security_Code" className="form-control" value={formData.social_Security_Code} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="section-header">Address Information</div>
                    <div className="form-group">
                        <label htmlFor="Primary_Address">Address</label>
                        <textarea id="Primary_Address" name="Primary_Address" className="form-control" rows="2" value={formData.Primary_Address} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="Primary_Address_State">State</label>
                            <select
                                id="Primary_Address_State"
                                name="Primary_Address_State"
                                className="form-control"
                                value={showOtherState ? "Others" : formData.Primary_Address_State}
                                onChange={handleStateChange}
                            >
                                <option value="">Select State</option>
                                {availableStates.map(s => (
                                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                                ))}
                                <option value="Others">Others</option>
                            </select>
                            {showOtherState && (
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ marginTop: '8px' }}
                                    placeholder="Enter State Name"
                                    value={formData.Primary_Address_State}
                                    name="Primary_Address_State"
                                    onChange={handleChange}
                                />
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="Primary_Address_Zip_Code">Zip Code</label>
                            <input type="text" id="Primary_Address_Zip_Code" name="Primary_Address_Zip_Code" className="form-control" value={formData.Primary_Address_Zip_Code} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Loan Details */}
                    <div className="section-header">Loan Details</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="Request_Loan_Amount">Loan Amount ($)</label>
                            <input type="number" id="Request_Loan_Amount" name="Request_Loan_Amount" className="form-control" value={formData.Request_Loan_Amount} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loanPurpose">Loan Purpose</label>
                            <select id="loanPurpose" name="loanPurpose" className="form-control" value={formData.loanPurpose} onChange={handleChange}>
                                <option value="Debt Consolidation">Debt Consolidation</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="citizenshipStatus">Citizenship Status</label>
                        <select id="citizenshipStatus" name="citizenshipStatus" className="form-control" value={formData.citizenshipStatus} onChange={handleChange}>
                            <option value="US Citizen">US Citizen</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    {/* Employment Information */}
                    <div className="section-header">Employment Information</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="selfEmployee">Self Employed</label>
                            <select id="selfEmployee" name="selfEmployee" className="form-control" value={formData.selfEmployee} onChange={handleChange}>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="income">Annual Income ($)</label>
                            <input type="text" id="income" name="income" className="form-control" value={formData.income} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cCompanyName">Company Name</label>
                            <input type="text" id="cCompanyName" name="cCompanyName" className="form-control" value={formData.cCompanyName} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hireDate">Hire Date</label>
                            <input type="date" id="hireDate" name="hireDate" className="form-control" value={formData.hireDate} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cCity">Company City</label>
                            <input type="text" id="cCity" name="cCity" className="form-control" value={formData.cCity} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cZipCode">Company Zip</label>
                            <input type="text" id="cZipCode" name="cZipCode" className="form-control" value={formData.cZipCode} onChange={handleChange} />
                        </div>
                    </div>


                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={handleCancel} disabled={isLoading}>Cancel</button>
                        <button type="button" className="btn-save" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditUserPage;
