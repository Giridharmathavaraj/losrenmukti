import React, { useState, useEffect } from 'react';
import './LoanDashboard.css'
import { useNavigate, useLocation } from '@/Component/router-hooks';
import Nav from './Nav';
import { getApiUrl } from '../apiConfig';
import {
  ChevronDown, Bell, Mail, HelpCircle, User,
  Search, Pin, List, Plus, MoreVertical, ChevronUp, ChevronsUpDown, Activity // Added Activity
} from 'lucide-react';
import LoanForm from './LoanForm';
import ParticularLoanPage from './ParticularLoanPage';

const LoanDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log(location)
  console.log(navigate)
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Only the 'owner' account sees the Company column
  const isOwnerAccount = localStorage.getItem('username') === 'owner';

  // State for loans and companies
  const [loanData, setLoanData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);

  // Fetch Loans from Backend
  const fetchLoans = async () => {
    try {
      console.log("Fetching loans...");
      const response = await fetch(getApiUrl('/api/loans'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text.slice(0, 200));
        throw new Error(`Server Error: Expected JSON but received ${contentType || 'unknown'}. Please check backend routing.`);
      }

      const data = await response.json();
      console.log("Loans fetched:", data);
      
      // Transform data to match table structure if needed
      const formattedData = data.map(loan => {
        // ... (existing transform logic remains same)
          // Dynamic Calculations
          const principal = Number(loan.Request_Loan_Amount ?? 0);
          const statedRate = Number(loan.interestRate ?? 12) / 100;
          const rateType = loan.interestRateType || 'Annually';
          const fees = Number(loan.underwritingRefinanceFee ?? 0);
          const frequency = loan.paymentFrequency || 'Monthly';
          const annualInterestRate = rateType === 'Monthly' ? statedRate * 12 : statedRate;

          const termYears = 5;
          let periodsPerYear = 12;
          if (frequency === 'Weekly') periodsPerYear = 52;
          if (frequency === 'Bi-Weekly') periodsPerYear = 26;
          if (frequency === 'Quarterly') periodsPerYear = 4;
          if (frequency === 'Annually') periodsPerYear = 1;

          const totalPeriods = termYears * periodsPerYear;
          const interestExpense = principal * annualInterestRate * termYears;
          const financeCharge = interestExpense + fees;
          const totalOfPayments = principal + financeCharge;
          const basePayment = totalPeriods > 0 ? totalOfPayments / totalPeriods : 0;

          const completedCount = Object.keys(loan.completedPayments || {}).length;
          const principalRatio = totalOfPayments > 0 ? (principal / totalOfPayments) : 0;
          const paidPrincipal = completedCount * basePayment * principalRatio;
          const balance = principal - paidPrincipal;

          let schedule = loan.transactions || [];
          if (!schedule.length && loan.firstPaymentDate) {
            let currentDate = new Date(loan.firstPaymentDate + 'T12:00:00');
            if (isNaN(currentDate.getTime())) currentDate = new Date(loan.firstPaymentDate);
            for (let i = 1; i <= totalPeriods; i++) {
              const compDate = loan.completedPayments?.[i] || null;
              schedule.push({
                period: i,
                date: new Date(currentDate).toLocaleDateString(),
                Status: compDate ? 'Completed' : 'Pending',
                completedDate: compDate,
                payment: basePayment
              });
              if (frequency === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
              else if (frequency === 'Bi-Weekly') currentDate.setDate(currentDate.getDate() + 14);
              else if (frequency === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
              else if (frequency === 'Quarterly') currentDate.setMonth(currentDate.getMonth() + 3);
              else if (frequency === 'Annually') currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
          }

          const today = new Date();
          let amountPastDue = 0;
          let dpd = 0;
          let nextPayment = 'N/A';

          if (schedule.length > 0) {
            const nextPending = schedule.find(t => t.Status === 'Pending');
            if (nextPending) nextPayment = nextPending.date || 'N/A';

            schedule.forEach(t => {
              if (t.Status === 'Pending' && t.date) {
                const txDate = new Date(t.date);
                const diffDays = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                  amountPastDue += (t.payment || basePayment);
                  if (diffDays > dpd) dpd = diffDays;
                }
              }
            });
          }

          let status = 'Open';
          let subStatus = 'Open - Repaying';
          if (schedule.length > 0 && !schedule.find(t => t.Status === 'Pending')) {
            status = 'Closed';
            subStatus = 'Closed - Paid Off';
          } else if (dpd > 0) {
            subStatus = 'Open - Delinquent';
          }

          return {
            _id: loan._id,
            id: loan._id.substring(loan._id.length - 6), // Last 6 chars of ID
            name: `${loan.firstName} ${loan.lastName}`,
            status,
            subStatus,
            dpd,
            amountPastDue,
            balance: Math.max(0, balance),
            nextPayment,
            // Capture company info for owner only
            companyId: loan.companyId,
            companyName: (typeof loan.companyId === 'object' ? loan.companyId?.name : null),
            raw: loan
          };
        });
        setLoanData(formattedData);
      } catch (error) {
        console.error("Error fetching loans:", error);
        setError(error.message);
      }
    };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(getApiUrl('/api/companies'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setCompanies(await response.json());
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchLoans();
    if (isOwnerAccount) fetchCompanies();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedLoans = React.useMemo(() => {
    let sortableItems = [...loanData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [loanData, sortConfig]);

  const filteredLoans = sortedLoans.filter(loan => {
    const term = searchTerm.toLowerCase();
    return (
      loan.name.toLowerCase().includes(term) ||
      loan._id.toLowerCase().includes(term) ||
      (loan.companyName && loan.companyName.toLowerCase().includes(term))
    );
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} style={{ marginLeft: '5px', verticalAlign: 'middle', opacity: 0.5 }} />;
    return sortConfig.direction === 'asc' ?
      <ChevronUp size={14} style={{ marginLeft: '5px', verticalAlign: 'middle' }} /> :
      <ChevronDown size={14} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />;
  };





  const handleExport = () => {
    if (loanData.length === 0) {
      setIsMoreMenuOpen(false);
      return alert("No data to export");
    }

    // Define headers for "all mandatory data"
    const headers = [
      "Loan ID", "First Name", "Last Name", "Email", "Phone", "SSN", "Gender", "DOB",
      "Citizenship", "Primary Zip", "Primary Address", "Primary State", "Primary Country",
      "Property Status", "Rent Amount", "HouseHold Individuals",
      "Mailing Zip", "Mailing Address", "Mailing State", "Mailing Country",
      "Loan Amount", "Loan Purpose", "Self Employed", "Company Name", "Company Zip",
      "Company City", "Company Country", "Income", "Hire Date", "SMS Status",
      "Current Status", "Balance"
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...loanData.map(loan => {
        const r = loan.raw || {};
        return [
          `"${loan.id}"`,
          `"${r.firstName || ''}"`,
          `"${r.lastName || ''}"`,
          `"${r.email || ''}"`,
          `"${r.phone || ''}"`,
          `"${r.social_Security_Code || ''}"`,
          `"${r.gender || ''}"`,
          `"${r.dateOfBirth || ''}"`,
          `"${r.citizenshipStatus || ''}"`,
          `"${r.Primary_Address_Zip_Code || ''}"`,
          `"${r.Primary_Address || ''}"`,
          `"${r.Primary_Address_State || ''}"`,
          `"${r.Primary_Address_Country || ''}"`,
          `"${r.propertyStatus || ''}"`,
          r.rentAmount || 0,
          r.noOfIndividual || 0,
          `"${r.Mailing_Address_Zip_Code || ''}"`,
          `"${r.Mailing_Address || ''}"`,
          `"${r.Mailing_Address_State || ''}"`,
          `"${r.Mailing_Address_Country || ''}"`,
          r.Request_Loan_Amount || 0,
          `"${r.loanPurpose || ''}"`,
          `"${r.selfEmployee || ''}"`,
          `"${r.cCompanyName || ''}"`,
          `"${r.cZipCode || ''}"`,
          `"${r.cCity || ''}"`,
          `"${r.cCountry || ''}"`,
          `"${r.income || ''}"`,
          `"${r.hireDate || ''}"`,
          `"${r.smsStatus || ''}"`,
          `"${loan.status}"`,
          loan.balance.toFixed(2)
        ].join(',');
      })
    ];

    // Create blob and download link
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Loan_Full_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMoreMenuOpen(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => {
          // Robust CSV line splitter handling quotes
          const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          return row.split(regex).map(val => val.replace(/^"|"$/g, '').trim());
        });

        if (rows.length < 2) return alert("Empty or invalid CSV");

        const headers = rows[0];
        const dataRows = rows.slice(1).filter(r => r.length === headers.length && r.some(v => v !== ''));

        let successCount = 0;
        let failCount = 0;

        // Define mapping from CSV Headers to Backend Fields
        const headerMap = {
          "First Name": "firstName",
          "Last Name": "lastName",
          "Email": "email",
          "Phone": "phone",
          "SSN": "social_Security_Code",
          "Gender": "gender",
          "DOB": "dateOfBirth",
          "Citizenship": "citizenshipStatus",
          "Primary Zip": "Primary_Address_Zip_Code",
          "Primary Address": "Primary_Address",
          "Primary State": "Primary_Address_State",
          "Primary Country": "Primary_Address_Country",
          "Property Status": "propertyStatus",
          "Rent Amount": "rentAmount",
          "HouseHold Individuals": "noOfIndividual",
          "Mailing Zip": "Mailing_Address_Zip_Code",
          "Mailing Address": "Mailing_Address",
          "Mailing State": "Mailing_Address_State",
          "Mailing Country": "Mailing_Address_Country",
          "Loan Amount": "Request_Loan_Amount",
          "Loan Purpose": "loanPurpose",
          "Self Employed": "selfEmployee",
          "Company Name": "cCompanyName",
          "Company Zip": "cZipCode",
          "Company City": "cCity",
          "Company Country": "cCountry",
          "Income": "income",
          "Hire Date": "hireDate",
          "SMS Status": "smsStatus"
        };

        for (const row of dataRows) {
          const payload = {};
          headers.forEach((header, index) => {
            const field = headerMap[header];
            if (field) {
              let val = row[index];
              // Type conversion
              if (field === 'rentAmount' || field === 'noOfIndividual' || field === 'Request_Loan_Amount') {
                val = Number(val);
              }
              payload[field] = val;
            }
          });

          // Mandatory field check (basic)
          if (!payload.firstName || !payload.lastName || !payload.email) {
            failCount++;
            continue;
          }

          try {
            // Use the same FormData structure as LoanForm if needed, 
            // but for simple import, JSON might be easier if the server supports it.
            // However, the existing server expects multipart/form-data for loan creation.
            // Let's create a FormData object.
            const formData = new FormData();
            Object.keys(payload).forEach(key => formData.append(key, payload[key]));

            const response = await fetch(getApiUrl("/api/loans"), {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: formData,
            });

            if (response.ok) successCount++;
            else failCount++;
          } catch (err) {
            failCount++;
          }
        }

        alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
        fetchLoans(); // Refresh list
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to parse CSV file.");
      }
      setIsMoreMenuOpen(false);
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  const handleControl = (loan) => {
    // Navigate immediately using the existing loan data in loan.raw
    // ParticularLoanPage will fetch its own fresh data if needed
    console.log("handleControl clicked for:", loan?._id);
    // window.alert("Clicked: " + (loan?.name || "Unknown"));
    
    if (loan && loan._id) {
      navigate('/particular-loan', { 
        state: { 
          loanData: loan.raw,
          loanId: loan._id 
        } 
      });
    } else {
      console.error("Invalid loan record selected");
    }
  };

  return (
    <div className="dashboard-wrapper">
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px 20px',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #ffcdd2',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          <Activity size={18} />
          <span>{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginLeft: 'auto', 
              background: 'none', 
              border: 'none', 
              color: '#c62828', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              fontSize: '13px'
            }}
          >
            Retry
          </button>
        </div>
      )}
      {/* HEADER */}
      <Nav />

      <main className="container">
        {/* PAGE TITLE & BUTTON */}
        <div className="page-header">
          <h1>Account Manager</h1>
          <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="dropdown">
              <button
                className="btn-dark"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsMoreMenuOpen(false);
                }}
              >
                New Loan <ChevronDown size={14} />
              </button>
              {isDropdownOpen && (
                <div className="dropdown-content show">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                    setIsDropdownOpen(false);
                  }}>Loan Application</a>
                </div>
              )}
            </div>

            <div className="more-dropdown" style={{ position: 'relative' }}>
              <button
                className="btn-icon-only"
                onClick={() => {
                  setIsMoreMenuOpen(!isMoreMenuOpen);
                  setIsDropdownOpen(false);
                }}
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333'
                }}
              >
                <MoreVertical size={18} />
              </button>
              {isMoreMenuOpen && (
                <div className="dropdown-content show" style={{ right: 0, left: 'auto', minWidth: '120px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); document.getElementById('import-input').click(); }}>Import</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }}>Export</a>
                </div>
              )}
              <input
                id="import-input"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </div>
          </div>

        </div>

        {/* TABS */}
        <div className="tabs">
          <button className="tab active"><Pin size={14} /><a onClick={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
            setIsDropdownOpen(false); // Close dropdown after selection
          }}>Loan Application</a></button>
          <button className="tab active"><Pin size={14} /> All Loans</button>
          {/* <button className="tab"><Pin size={14} /> All Past Due</button>
  <button className="tab"><Pin size={14} /> Due Soon</button>
          <button className="tab"><List size={14} /> All Searches</button>
          <button className="tab btn-new"><Plus size={14} /> New Search</button> */}
        </div>

        {/* SEARCH */}
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Filter by Keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-header">{filteredLoans.length} RESULTS</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>ACCOUNT {getSortIcon('name')}</th>
                  <th>WARNING FLAGS</th>
                  <th onClick={() => requestSort('dpd')} style={{ cursor: 'pointer' }}>DAYS PAST DUE {getSortIcon('dpd')}</th>
                  <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>LOAN STATUS {getSortIcon('status')}</th>
                  <th onClick={() => requestSort('subStatus')} style={{ cursor: 'pointer' }}>LOAN SUB STATUS {getSortIcon('subStatus')}</th>
                  <th onClick={() => requestSort('amountPastDue')} style={{ cursor: 'pointer' }}>AMOUNT PAST DUE {getSortIcon('amountPastDue')}</th>
                  <th onClick={() => requestSort('balance')} style={{ cursor: 'pointer' }}>PRINCIPAL BALANCE {getSortIcon('balance')}</th>
                  <th onClick={() => requestSort('nextPayment')} style={{ cursor: 'pointer' }}>NEXT PAYMENT DATE {getSortIcon('nextPayment')}</th>
                  {isOwnerAccount && (
                    <th onClick={() => requestSort('companyName')} style={{ cursor: 'pointer' }}>COMPANY {getSortIcon('companyName')}</th>
                  )}
                </tr>
              </thead>
              <tbody >
                {filteredLoans.map((loan, index) => (

                  <tr key={index} onClick={() => handleControl(loan)}>
                    <td><input type="checkbox" /></td>
                    <td className="account-cell">
                      <div className="avatar-table">
                        <User size={18} />
                        <span className="online-dot"></span>
                      </div>
                      <div>
                        <div className="name">{loan.name}</div>
                        <div className="id">{loan.id}</div>
                      </div>
                    </td>
                    <td className="center">—</td>
                    <td>{loan.dpd}</td>
                    <td>
                      <span className={`badge ${loan.status === 'Open' ? 'blue' : 'gray'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td><span className="sub-status">{loan.subStatus}</span></td>
                    <td>${loan.amountPastDue.toFixed(2)}</td>
                    <td>${loan.balance.toFixed(2)}</td>
                    <td>{loan.nextPayment}</td>
                    {isOwnerAccount && (
                      <td>
                        {loan.companyName || 
                         companies.find(c => c._id === (typeof loan.companyId === 'object' ? loan.companyId?._id : loan.companyId))?.name || 
                         (typeof loan.companyId === 'string' ? loan.companyId : 'N/A')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <LoanForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoanAdded={fetchLoans}
      />
    </div>
  );
};

export default LoanDashboard;