// RecordForm.jsx
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../apiConfig';
import { useNavigate } from '@/Component/router-hooks';
import './RecordForm.css';
import Nav from '../Nav';

const RecordForm = () => {
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'users',
    status: 'enable',
    companyId: ''
  });

  const [companies, setCompanies] = useState([]);
  const currentUserRole = localStorage.getItem('role') || '';

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(getApiUrl('/api/companies'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchCompanies();
  }, []);



  // State to store all created records
  const [records, setRecords] = useState([]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (Create new record)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username: formData.name, // Mapping 'name' from form to 'username' expected by backend
          password: formData.password,
          role: formData.role,
          status: formData.status,
          companyId: formData.companyId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register user');
      }

      console.log('User Created in MongoDB:', data);

      // Add new record to the list (using the form data for local display)
      const newRecord = {
        id: Date.now(), // unique ID for local list
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        companyId: formData.companyId
      };
      setRecords((prev) => [...prev, newRecord]);

      // Clear form fields
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'users',
        status: 'enable',
        companyId: ''
      });

      alert('User successfully added to MongoDB! Please login with your new account.');
      navigate('/login');

    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error: ' + error.message);
    }
  };

  // Delete a record
  const deleteRecord = (id) => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  return (
    <>

      <Nav />
      <div className="container">
        <div className="form-section">
          <h2>Create New User</h2>

          <form onSubmit={handleSubmit} className="record-form">
            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {/* Company Field (Only for Super Admins) */}
            {currentUserRole === 'superadmin' && (
              <div className="form-group">
                <label htmlFor="companyId">Company</label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                >
                  <option value="">No Company</option>
                  {companies.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Field */}
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="users">User</option>
                <option value="admin">Admin</option>
                {currentUserRole === 'superadmin' && (
                  <option value="superadmin">Super Admin</option>
                )}
              </select>
            </div>

            {/* Status Field */}
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

            <button type="submit" className="submit-btn">
              Create User
            </button>

          </form>
        </div>

        {/* Display Records List */}

      </div>
    </>
  );
};

export default RecordForm;