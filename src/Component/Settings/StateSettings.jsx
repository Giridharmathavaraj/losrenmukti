'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../../apiConfig';
import Nav from '../Nav';
import { Plus, Download, Upload, Trash2, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import './StateSettings.css';

const StateSettings = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  const [newOriginationFees, setNewOriginationFees] = useState('');
  const [newMinLoanAmount, setNewMinLoanAmount] = useState('');
  const [newMaxLoanAmount, setNewMaxLoanAmount] = useState('');
  const [editingId, setEditingId] = useState(null);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/states'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStates(data);
      } else {
        setError(data.error || 'Failed to fetch states');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewCode('');
    setNewInterestRate('');
    setNewOriginationFees('');
    setNewMinLoanAmount('');
    setNewMaxLoanAmount('');
    setEditingId(null);
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newName.trim() || !newCode.trim()) {
      setError('Both Name and Code are required');
      return;
    }

    try {
      const url = editingId ? getApiUrl(`/api/states/${editingId}`) : getApiUrl('/api/states');
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newName,
          code: newCode,
          interestRate: newInterestRate,
          originationFees: newOriginationFees,
          minLoanAmount: newMinLoanAmount,
          maxLoanAmount: newMaxLoanAmount,
          status: editingId ? undefined : 'Pending'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? 'State updated successfully' : 'State added successfully');
        resetForm();
        fetchStates();
      } else {
        setError(data.error || 'Failed to process state');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleEdit = (state) => {
    setEditingId(state._id);
    setNewName(state.name);
    setNewCode(state.code);
    setNewInterestRate(state.interestRate);
    setNewOriginationFees(state.originationFees);
    setNewMinLoanAmount(state.minLoanAmount);
    setNewMaxLoanAmount(state.maxLoanAmount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/states/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setSuccess('State deleted');
        if (editingId === id) resetForm();
        fetchStates();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete state');
      }
    } catch (err) {
      setError('Connection error while deleting');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(getApiUrl(`/api/states/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuccess(`State status updated to ${newStatus}`);
        fetchStates();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update state status');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (states.length === 0) {
      setError('No data to export');
      return;
    }

    const headers = ['Name', 'Code', 'Interest Rate', 'Origination Fees', 'Min Loan', 'Max Loan', 'Status'];
    const rows = states.map(s => `"${s.name}","${s.code}","${s.interestRate || 0}","${s.originationFees || 0}","${s.minLoanAmount || 0}","${s.maxLoanAmount || 0}","${s.status || 'Pending'}"`);
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'states_export.csv';
    link.click();
  };

  // CSV Import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const lines = csvData.split(/\r?\n/);

      const parsedStates = [];
      // Robust CSV row parser using regex to handle quotes and commas correctly
      const parseCsvRow = (text) => {
        const re_value = /(?!\s*$)\s*(?:'([^']*(?:''[^']*)*)'|"([^"]*(?:""[^"]*)*)"|([^,\s\n\r\t]*))\s*(?:,|$)/g;
        const row = [];
        text.replace(re_value, (m0, m1, m2, m3) => {
          if (m1 !== undefined) row.push(m1.replace(/''/g, "'"));
          else if (m2 !== undefined) row.push(m2.replace(/""/g, '"'));
          else if (m3 !== undefined) row.push(m3);
          return '';
        });
        return row;
      };

      const startIndex = (lines[0] && lines[0].toLowerCase().includes('name')) ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const row = parseCsvRow(lines[i]);
        if (row.length >= 2) {
          const name = row[0] ? row[0].trim() : '';
          const code = row[1] ? row[1].trim() : '';
          const interestRate = row[2] ? row[2].trim() : 0;
          const originationFees = row[3] ? row[3].trim() : 0;
          const minLoanAmount = row[4] ? row[4].trim().replace(/,/g, '') : 0;
          const maxLoanAmount = row[5] ? row[5].trim().replace(/,/g, '') : 0;
          const status = row[6] ? row[6].trim() : 'Pending';

          if (name && code) {
            parsedStates.push({ name, code, interestRate, originationFees, minLoanAmount, maxLoanAmount, status });
          }
        }
      }

      if (parsedStates.length === 0) {
        setError('No valid data found in CSV. Ensure format is: Name,Code');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/api/states/import'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ states: parsedStates })
        });
        const data = await res.json();

        if (res.ok) {
          setSuccess(`Successfully imported ${data.importedCount} new states`);
          fetchStates();
        } else {
          setError(data.error || 'Bulk import failed');
        }
      } catch (err) {
        setError('Connection error during import');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="layout">
      <Nav />
      <main className="main-content">
        <div className="page-header">
          <div className="header-titles">
            <h1>State Configurations</h1>
            <p>Manage operating states and location codes for the application</p>
          </div>
          <div className="header-actions">
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              <Upload size={16} /> Import CSV
            </button>
            <button className="btn-secondary" onClick={handleExportCSV} disabled={states.length === 0 || loading}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {error && <div className="alert-error"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert-success"><CheckCircle size={16} /> {success}</div>}

        <div className="content-grid">
          {/* Add/Edit State Form */}
          <div className="card add-state-card">
            <h3>{editingId ? 'Edit State' : 'Add New State'}</h3>
            <form onSubmit={handleAddState} className="add-state-form">
              <div className="form-group">
                <label>State Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., California"
                  required
                />
              </div>
              <div className="form-group">
                <label>State Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g., CA"
                  maxLength="5"
                  required
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInterestRate}
                  onChange={(e) => setNewInterestRate(e.target.value)}
                  placeholder="e.g., 5.5"
                />
              </div>
              <div className="form-group">
                <label>Origination Fees (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newOriginationFees}
                  onChange={(e) => setNewOriginationFees(e.target.value)}
                  placeholder="e.g., 2.0"
                />
              </div>
              <div className="form-group">
                <label>Min Loan Amount</label>
                <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94a3b8' }}>$</span>
                  <input
                    type="number"
                    value={newMinLoanAmount}
                    onChange={(e) => setNewMinLoanAmount(e.target.value)}
                    placeholder="e.g., 1000"
                    style={{ paddingLeft: '30px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Max Loan Amount</label>
                <div className="input-with-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', color: '#94a3b8' }}>$</span>
                  <input
                    type="number"
                    value={newMaxLoanAmount}
                    onChange={(e) => setNewMaxLoanAmount(e.target.value)}
                    placeholder="e.g., 50000"
                    style={{ paddingLeft: '30px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {editingId ? 'Update State' : 'Add State'}
                </button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* States Table */}
          <div className="card table-card">
            <h3>Active States ({states.length})</h3>
            {loading && states.length === 0 ? (
              <div className="loading-state">Loading states...</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>State Name</th>
                      <th>Code</th>
                      <th>Rate (%)</th>
                      <th>Fees (%)</th>
                      <th>Min Loan</th>
                      <th>Max Loan</th>
                      <th>Status</th>
                      <th>Added On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {states.length === 0 ? (
                      <tr><td colSpan="9" className="empty-state">No states configured yet. Add one manually or import a CSV. </td></tr>
                    ) : (
                      states.map(state => (
                        <tr key={state._id}>
                          <td><strong>{state.name}</strong></td>
                          <td><span className="badge-code">{state.code}</span></td>
                          <td>{state.interestRate || 0}%</td>
                          <td>{state.originationFees || 0}%</td>
                          <td>{formatter.format(state.minLoanAmount || 0)}</td>
                          <td>{formatter.format(state.maxLoanAmount || 0)}</td>
                          <td>
                            <span className={`badge ${state.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                              {state.status || 'Pending'}
                            </span>
                          </td>
                          <td>{new Date(state.createdAt).toLocaleDateString()}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button className="btn-icon edit" onClick={() => handleEdit(state)} title="Edit State" style={{ marginRight: '4px' }}>
                              <Edit size={16} />
                            </button>
                            {state.status === 'Approved' ? (
                              <button className="btn-icon revert" onClick={() => handleUpdateStatus(state._id, 'Pending')} title="Revert to Pending">
                                <AlertCircle size={16} />
                              </button>
                            ) : (
                              <button className="btn-icon approve" onClick={() => handleUpdateStatus(state._id, 'Approved')} title="Approve State">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button className="btn-icon delete" onClick={() => handleDelete(state._id)} title="Delete State">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StateSettings;
