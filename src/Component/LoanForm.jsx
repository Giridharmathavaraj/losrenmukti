import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "./LoanForm.css";
import { getApiUrl } from '../apiConfig';

const LoanForm = ({ isOpen, onClose, onLoanAdded }) => {
  const [propertyStatus, setPropertyStatus] = useState("Rent");
  const [rentAmount, setRentAmount] = useState("");
  const [selfEmployee, setSelfEmployee] = useState("Yes");
  const [selectedFiles, setSelectedFiles] = useState({
    driversLicense: null,
    payStub1: null,
    payStub2: null,
    bankStatement1: null,
    bankStatement2: null
  });
  const [formData, setFormData] = useState({
    firstName: "",
    generationCode: "None",
    email: "",
    phone: "",
    social_Security_Code: "",
    lastName: "",
    gender: "Female",
    dateOfBirth: "",
    citizenshipStatus: "US Citizen",
    Primary_Address_Zip_Code: "",
    Primary_Address: "",
    Primary_Address_State: "",
    Primary_Address_Country: "US Citizen",
    noOfIndividual: 0,
    Mailing_Address_Zip_Code: "",
    Mailing_Address: "",
    Mailing_Address_State: "",
    Mailing_Address_Country: "US Citizen",
    Request_Loan_Amount: 0,
    loanPurpose: "Debt Consolidation",
    cCompanyName: "",
    cZipCode: "",
    cCity: "",
    cCountry: "US Citizen",
    income: "",
    hireDate: "",
    coFirstName: "",
    coLastName: "",
    coGenerationCode: "None",
    coEmail: "",
    coPhone: "",
    coGender: "Female",
    coDateOfBirth: "",
    coPrimary_Address_Zip_Code: "",
    coPrimary_Address: "",
    coPrimary_Address_State: "",
    coPrimary_Address_Country: "",
    coMailing_Address_Zip_Code: "",
    coMailing_Address: "",
    coMailing_Address_State: "",
    coMailing_Address_Country: "",
    checkBox: true,
    smsStatus: 'Opt Out',
    potentialBorrower: false,
    interestRate: 12,
    underwritingRefinanceFee: 0
  });

  const [availableStates, setAvailableStates] = useState([]);
  const [selectedStateConfig, setSelectedStateConfig] = useState(null);
  const [amountError, setAmountError] = useState("");
  const [showOther, setShowOther] = useState({
    primary: false,
    mailing: false,
    coPrimary: false,
    coMailing: false
  });

  const handleStateChange = (field, value, type) => {
    if (value === "Others") {
      setShowOther(prev => ({ ...prev, [type]: true }));
      setFormData(prev => ({ ...prev, [field]: "" }));
      if (type === 'primary') {
        setSelectedStateConfig(null);
        setAmountError("");
      }
    } else {
      setShowOther(prev => ({ ...prev, [type]: false }));
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Auto-populate logic for Primary Address State
      if (type === 'primary') {
        const stateConfig = availableStates.find(s => s.name === value);
        if (stateConfig) {
          setSelectedStateConfig(stateConfig);
          
          const amount = Number(formData.Request_Loan_Amount) || 0;
          const feePercent = stateConfig.originationFees || 0;
          const calculatedFee = (amount * feePercent) / 100;

          setFormData(prev => ({
            ...prev,
            [field]: value,
            interestRate: stateConfig.interestRate || 12,
            underwritingRefinanceFee: calculatedFee
          }));
          validateAmount(amount, stateConfig);
        } else {
          setSelectedStateConfig(null);
          setAmountError("");
        }
      }
    }
  };

  const validateAmount = (amount, config) => {
    if (!config) return;
    const val = Number(amount);
    if (config.minLoanAmount && val < config.minLoanAmount) {
      setAmountError(`Min loan for ${config.name} is $${config.minLoanAmount.toLocaleString()}`);
    } else if (config.maxLoanAmount && val > config.maxLoanAmount) {
      setAmountError(`Max loan for ${config.name} is $${config.maxLoanAmount.toLocaleString()}`);
    } else {
      setAmountError("");
    }
  };

  const handleAmountChange = (val) => {
    const amount = Number(val) || 0;
    const updates = { Request_Loan_Amount: val };

    if (selectedStateConfig) {
      const feePercent = selectedStateConfig.originationFees || 0;
      updates.underwritingRefinanceFee = (amount * feePercent) / 100;
      validateAmount(val, selectedStateConfig);
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(getApiUrl('/api/states'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Only show approved states in the application form
          setAvailableStates(data.filter(s => s.status === 'Approved'));
        }
      } catch (error) {
        console.error("Error fetching states for dropdown:", error);
      }
    };
    if (isOpen) {
      fetchStates();
    }
  }, [isOpen]);

  const handleFileChange = (field, file) => {
    setSelectedFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare clean payload
    const cleanedData = { ...formData, propertyStatus, selfEmployee };

    // Handle conditional rentAmount
    if (propertyStatus === 'Rent') {
      cleanedData.rentAmount = Number(rentAmount);
    } else {
      delete cleanedData.rentAmount; // Don't send if not renting
    }

    // Convert numeric strings to numbers
    if (cleanedData.noOfIndividual) cleanedData.noOfIndividual = Number(cleanedData.noOfIndividual);
    if (cleanedData.Request_Loan_Amount) cleanedData.Request_Loan_Amount = Number(cleanedData.Request_Loan_Amount);
    if (cleanedData.income) cleanedData.income = cleanedData.income; // Keep as string (schema says String)

    // Handle optional dates (prevent empty string casting error)
    if (!cleanedData.coDateOfBirth) delete cleanedData.coDateOfBirth;

    // NOTE: dateOfBirth and hireDate are required. If empty, server will still throw 400 validation error (Path required).

    try {
      console.log("Preparing FormData for:", cleanedData);

      const data = new FormData();

      // Append text fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] !== undefined) {
          data.append(key, cleanedData[key]);
        }
      });

      // Append files
      Object.keys(selectedFiles).forEach(key => {
        if (selectedFiles[key]) {
          data.append(key, selectedFiles[key]);
        }
      });

      const response = await fetch(getApiUrl("/api/loans"), {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data,
      });

      const resData = await response.json();

      if (response.ok) {
        alert("Submitted to MongoDB!");
        if (onLoanAdded) onLoanAdded();
        onClose();
      } else {
        alert(`Error: ${resData.error || "Submission failed"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Check if your local server is running on port 5000.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">

        <div className="modal-header">
          <span className="modal-title">Custom Application Form</span>
          <X className="close-icon" onClick={onClose} />
        </div>


        <div className="modal-body-gradient">
          <div className="application-card">
            <h2 className="form-main-title">LOAN APPLICATION</h2>
            
            {amountError && (
              <div style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', fontWeight: '500', border: '1px solid #feb2b2' }}>
                ⚠️ {amountError}
              </div>
            )}

            <form className="form-content" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Generation Code</label>
                <select
                  value={formData.generationCode}
                  onChange={(e) =>
                    setFormData({ ...formData, generationCode: e.target.value })
                  }
                >
                  <option value="None">None</option>
                  <option value="v1">Version 1</option>
                  <option value="v2">Version 2</option>
                </select>
              </div>

              <div className="input-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Social Security Code *</label>
                <input
                  type="text"
                  value={formData.social_Security_Code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_Security_Code: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Citizenship Status *</label>
                <select
                  value={formData.citizenshipStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      citizenshipStatus: e.target.value,
                    })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>

              <div className="full-width">
                <h4>
                  <u>HOUSEHOLD INFORMATION</u>
                </h4>
              </div>

              <div className="input-group">
                <label>Primary Address Zip Code *</label>
                <input
                  type="text"
                  value={formData.Primary_Address_Zip_Code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Primary_Address_Zip_Code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Primary Address *</label>
                <input
                  type="text"
                  value={formData.Primary_Address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Primary_Address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Primary Address State</label>
                <select
                  value={showOther.primary ? "Others" : formData.Primary_Address_State}
                  onChange={(e) => handleStateChange("Primary_Address_State", e.target.value, "primary")}
                >
                  <option value="">Select State</option>
                  {availableStates.map(s => (
                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {showOther.primary && (
                  <input
                    type="text"
                    placeholder="Enter State Name"
                    value={formData.Primary_Address_State}
                    onChange={(e) => setFormData({ ...formData, Primary_Address_State: e.target.value })}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="input-group">
                <label>Primary Address Country *</label>
                <select
                  value={formData.Primary_Address_Country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Primary_Address_Country: e.target.value,
                    })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Do you rent or own this property? *</label>
                <select
                  value={propertyStatus}
                  onChange={(e) => setPropertyStatus(e.target.value)}
                >
                  <option value="Rent">Rent</option>
                  <option value="Own">Own</option>
                </select>
              </div>

              {/* 2. CONDITIONAL RENDER: Show only if "Rent" is selected */}
              {propertyStatus === "Rent" && (
                <div className="input-group">
                  <label>Monthly Rent Payment *</label>
                  <input
                    type="number"
                    placeholder="Enter monthly rent"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="input-group">
                <label>Number of Indivuals in the HouseHold *</label>
                <input
                  type="text"
                  value={formData.noOfIndividual}
                  onChange={(e) =>
                    setFormData({ ...formData, noOfIndividual: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Mailing Address Zip Code *</label>
                <input
                  type="text"
                  value={formData.Mailing_Address_Zip_Code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Mailing_Address_Zip_Code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Mailing Address *</label>
                <input
                  type="text"
                  value={formData.Mailing_Address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Mailing_Address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Mailing Address State</label>
                <select
                  value={showOther.mailing ? "Others" : formData.Mailing_Address_State}
                  onChange={(e) => handleStateChange("Mailing_Address_State", e.target.value, "mailing")}
                >
                  <option value="">Select State</option>
                  {availableStates.map(s => (
                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {showOther.mailing && (
                  <input
                    type="text"
                    placeholder="Enter State Name"
                    value={formData.Mailing_Address_State}
                    onChange={(e) => setFormData({ ...formData, Mailing_Address_State: e.target.value })}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="input-group">
                <label>Mailing Address Country *</label>
                <select
                  value={formData.Mailing_Address_Country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Mailing_Address_Country: e.target.value,
                    })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>
              <div className="full-width">
                <h4>
                  <u>LOAN INFORMATION</u>
                </h4>
              </div>
              <div className="input-group">
                <label>Request Loan Amount *</label>
                <input
                  type="number"
                  value={formData.Request_Loan_Amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  style={{ borderColor: amountError ? '#e53e3e' : undefined }}
                />
              </div>
              <div className="input-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="Inherited from State"
                />
                {formData.Request_Loan_Amount > 0 && formData.interestRate > 0 && (
                   <span style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                     Est. Interest: ${(Number(formData.Request_Loan_Amount) * Number(formData.interestRate) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </span>
                )}
              </div>
              <div className="input-group">
                <label>Underwriting/Refinance Fee ($)</label>
                <input
                  type="number"
                  value={formData.underwritingRefinanceFee}
                  onChange={(e) => setFormData({ ...formData, underwritingRefinanceFee: e.target.value })}
                  placeholder="Calculated from State Fee %"
                />
                {selectedStateConfig && (
                   <span style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                     (Calculated at {selectedStateConfig.originationFees}% of Amount)
                   </span>
                )}
              </div>
              <div className="input-group">
                <label>Loan Purpose *</label>
                <select
                  value={formData.loanPurpose}
                  onChange={(e) =>
                    setFormData({ ...formData, loanPurpose: e.target.value })
                  }
                >
                  <option value="Debt Consolidation">Debt Consolidation</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="full-width">
                <h4>
                  <u>EMPLOYMENT INFORMATION</u>
                </h4>
              </div>
              <div className="input-group">
                <label>Self Employeed * </label>
                <select
                  value={selfEmployee}
                  onChange={(e) => setSelfEmployee(e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="input-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.cCompanyName}
                  onChange={(e) =>
                    setFormData({ ...formData, cCompanyName: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Zip Code *</label>
                <input
                  type="text"
                  value={formData.cZipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, cZipCode: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.cCity}
                  onChange={(e) =>
                    setFormData({ ...formData, cCity: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Country *</label>
                <select
                  value={formData.cCountry}
                  onChange={(e) =>
                    setFormData({ ...formData, cCountry: e.target.value })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Income *</label>
                <input
                  type="text"
                  value={formData.income}
                  onChange={(e) =>
                    setFormData({ ...formData, income: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Hire Date *</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) =>
                    setFormData({ ...formData, hireDate: e.target.value })
                  }
                />
              </div>
              <div className="full-width">
                <h4>
                  <u>CO-BORROWER IF-APPLICABLE</u>
                </h4>
              </div>
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.coFirstName}
                  onChange={(e) =>
                    setFormData({ ...formData, coFirstName: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.coLastName}
                  onChange={(e) =>
                    setFormData({ ...formData, coLastName: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Generation Code</label>
                <select
                  value={formData.coGenerationCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coGenerationCode: e.target.value,
                    })
                  }
                >
                  <option value="None">None</option>
                  <option value="v1">Version 1</option>
                  <option value="v2">Version 2</option>
                </select>
              </div>

              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.coEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, coEmail: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.coPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, coPhone: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Gender *</label>
                <select
                  value={formData.coGender}
                  onChange={(e) =>
                    setFormData({ ...formData, coGender: e.target.value })
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.coDateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, coDateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Primary Address Zip Code *</label>
                <input
                  type="text"
                  value={formData.Primary_Address_Zip_Code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Primary_Address_Zip_Code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Primary Address *</label>
                <input
                  type="text"
                  value={formData.coPrimary_Address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coPrimary_Address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Primary Address State</label>
                <select
                  value={showOther.coPrimary ? "Others" : formData.coPrimary_Address_State}
                  onChange={(e) => handleStateChange("coPrimary_Address_State", e.target.value, "coPrimary")}
                >
                  <option value="">Select State</option>
                  {availableStates.map(s => (
                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {showOther.coPrimary && (
                  <input
                    type="text"
                    placeholder="Enter State Name"
                    value={formData.coPrimary_Address_State}
                    onChange={(e) => setFormData({ ...formData, coPrimary_Address_State: e.target.value })}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="input-group">
                <label>Primary Address Country *</label>
                <select
                  value={formData.coPrimary_Address_Country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coPrimary_Address_Country: e.target.value,
                    })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Mailing Address Zip Code *</label>
                <input
                  type="text"
                  value={formData.coMailing_Address_Zip_Code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coMailing_Address_Zip_Code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Mailing Address *</label>
                <input
                  type="text"
                  value={formData.coMailing_Address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coMailing_Address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Mailing Address State</label>
                <select
                  value={showOther.coMailing ? "Others" : formData.coMailing_Address_State}
                  onChange={(e) => handleStateChange("coMailing_Address_State", e.target.value, "coMailing")}
                >
                  <option value="">Select State</option>
                  {availableStates.map(s => (
                    <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {showOther.coMailing && (
                  <input
                    type="text"
                    placeholder="Enter State Name"
                    value={formData.coMailing_Address_State}
                    onChange={(e) => setFormData({ ...formData, coMailing_Address_State: e.target.value })}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              <div className="input-group">
                <label>Mailing Address Country *</label>
                <select
                  value={formData.coMailing_Address_Country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coMailing_Address_Country: e.target.value,
                    })
                  }
                >
                  <option value="US Citizen"> US Citizen</option>
                  <option value="Others"> Others</option>
                </select>
              </div>

              <div className="form-section">
                <h4>
                  <u>UPLOAD DOCUMENTS</u>
                </h4>
                <div className="file-upload-grid">
                  {[
                    { label: "Driver's License", field: "driversLicense" },
                    { label: "Pay Stub #1 - Most Recent", field: "payStub1" },
                    { label: "Pay Stub #2 - Most Recent", field: "payStub2" },
                    { label: "Bank Statement #1 - Most Recent", field: "bankStatement1" },
                    { label: "Bank Statement #2 - Most Recent", field: "bankStatement2" }
                  ].map((doc, ind) => (
                    <div className="input-group file-group" key={ind}>
                      <label>{doc.label}</label>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(doc.field, e.target.files[0])}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="full-width">
                <h4><u>PLEASE CLICK BELOW TO REVIEW THE GLBA DISCLOSURE AND PRIVACY POLICY</u></h4>
                <a href="https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act" target="_blank"> <i>GLBA disclosure</i></a>
              </div>
              <div className="full-width">
                <label >
                  <input type="checkbox" checked={formData.checkBox} onChange={(e) => setFormData({ ...formData, checkBox: e.target.checked })} />
                  I agree to the GLBA Disclosure and Privacy Policy
                </label>
              </div>



              <div className="input-group">
                <label>SMS Status *</label>
                <select
                  value={formData.smsStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, smsStatus: e.target.value })
                  }
                >
                  <option value="Opt Out">Opt Out</option>
                  <option value="Opt In">Opt In</option>

                </select>
              </div>
              <div className="input-group">

                <a href="https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act" target="_blank"> <i>Privacy Policy</i></a>
              </div>
              <div className="input-group">


                <label >

                  <input type="checkbox" checked={formData.potentialBorrower} onChange={(e) => setFormData({ ...formData, potentialBorrower: e.target.checked })} />
                  Check if the applicant or potential borrower, has not been approached, including via telephone or electroic means, by any person to sen money in consideration of receiving money via a government or lottery organization?
                </label>
              </div>

              <button type="submit" className="btns" > Submit</button>
            </form>
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="modal-footer">
          <button className="close-btn-text" onClick={onClose}>
            close
          </button>
        </div>
      </div>
    </div >
  );
};

export default LoanForm;
