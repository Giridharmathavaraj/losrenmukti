'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';
import { useLocation, useNavigate } from '@/Component/router-hooks';
import {
  ArrowLeft, Edit, Link2, MoreHorizontal, X, Plus, MoreVertical,
  User, Mail, Phone, MapPin, Globe, Twitter, Linkedin,
  ChevronDown, Settings, CreditCard, FileText, ChevronRight, Calendar, DollarSign, Percent, Activity
} from 'lucide-react';
import './ParticularLoanPage.css';
import Nav from './Nav';


const UploadsView = ({ loanData, handleUpdateDocument, isUploading }) => (
  <div className="uploads-tab-content">
    <div className="dashboard-widget">
      <div className="widget-title">DOCUMENTS & UPLOADS</div>
      <div className="document-list-container">
        {[
          { label: "Driver's License", field: "driversLicense" },
          { label: "Pay Stub #1", field: "payStub1" },
          { label: "Pay Stub #2", field: "payStub2" },
          { label: "Bank Statement #1", field: "bankStatement1" },
          { label: "Bank Statement #2", field: "bankStatement2" }
        ].map((doc, idx) => {
          const hasFile = loanData.documents && loanData.documents[doc.field];
          return (
            <div key={idx} className="document-row" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #eee'
            }}>
              <div className="doc-meta">
                <div style={{ fontWeight: 500 }}>{doc.label}</div>
                <div style={{ fontSize: 12, color: hasFile ? '#28a745' : '#dc3545' }}>
                  {hasFile ? '✓ Uploaded' : '✗ Missing'}
                </div>
              </div>
              <div className="doc-actions" style={{ display: 'flex', gap: 10 }}>
                <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <Plus size={14} /> {hasFile ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUpdateDocument(doc.field, e.target.files[0])}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {isUploading && (
      <div className="upload-overlay" style={{
        marginTop: 10,
        textAlign: 'center',
        color: '#007bff',
        fontSize: 14,
        fontWeight: 500
      }}>
        Uploading document... Please wait.
      </div>
    )}
  </div>
);

const DynamicDonutChart = ({ data, totalValue, totalLabel }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  let cumulativeValue = 0;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ position: 'relative', width: '180px', height: '180px' }}>
      <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
        {data.map((d, i) => {
          if (total === 0) return null;
          const percentage = (d.value / total) * 100;
          const offset = -cumulativeValue;
          cumulativeValue += percentage;
          if (percentage === 0) return null;

          return (
            <circle
              key={i}
              cx="21" cy="21" r="15.9155"
              fill="none"
              stroke={d.color}
              strokeWidth={hoveredIndex === i ? "6" : "5"}
              strokeDasharray={`${percentage} 100`}
              strokeDashoffset={offset}
              style={{ transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <title>{d.label}: ${d.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</title>
            </circle>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {hoveredIndex !== null ? (
          <>
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>{data[hoveredIndex].label}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: data[hoveredIndex].color }}>
              ${data[hoveredIndex].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </>
        ) : (
          <>
            {totalLabel && <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>{totalLabel}</div>}
            <div style={{ fontSize: '20px', color: '#333', fontWeight: 'bold' }}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MailsMessagesView = ({ loanData, setLoanData }) => {
  const [isComposing, setIsComposing] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = async () => {
    if (!subject || !message) return alert("Subject and message required");
    setIsSending(true);
    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}/send-email`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subject, message, recipient: loanData.email })
      });
      if (response.ok) {
        const updatedLoan = await response.json();
        setLoanData(updatedLoan); // Dynamically update emails history array directly into UI
        alert("Mail Sent Successfully! Logged in Database bounds.");
        setIsComposing(false);
        setSubject('');
        setMessage('');
      } else {
        alert("Server failed to dispatch the custom email string.");
      }
    } catch (e) {
      console.error(e);
      alert("Error sending email over network proxy block.");
    } finally {
      setIsSending(false);
    }
  };

  const emails = loanData?.emails || [];

  return (
    <div style={{ padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-widget" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>Communication Transcript & Mail Log</h3>
          <button className="btn-primary" onClick={() => setIsComposing(!isComposing)} style={{ padding: '8px 16px' }}>
            {isComposing ? 'Cancel Mail Output' : '+ Send Mail To Client'}
          </button>
        </div>

        {isComposing && (
          <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #0d6efd', borderRadius: '8px', backgroundColor: '#f8fbff' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#007bff' }}>Dispatch New Secure Communication</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Subject Handle" value={subject} onChange={e => setSubject(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <textarea placeholder="Write exact message content. Sent with formatting preserved natively from template." rows={5} value={message} onChange={e => setMessage(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => setIsComposing(false)}>Cancel Draft</button>
                <button className="btn-primary" onClick={handleSend} disabled={isSending}>
                  {isSending ? 'Sending Package...' : 'Send Message Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {emails.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic', padding: '16px' }}>No direct communications have been recorded against this loan profile so far.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...emails].reverse().map((email, idx) => (
              <div key={idx} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{email.subject}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>To: {email.recipient} &middot; Output by Backend Authority Layer</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#999' }}>{new Date(email.sentAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#444', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {email.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentsView = ({ loanData }) => {
  const comments = loanData?.comments || [];

  return (
    <div style={{ padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-widget" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>Activity Log & Comments</h3>
        {comments.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic', padding: '16px' }}>No updates logged yet. Updates to the loan will appear here.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            {[...comments].reverse().map((c, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid #eef2f6', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {c.updatedBy ? c.updatedBy.substring(0, 2).toUpperCase() : 'SY'}
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#111' }}>{c.updatedBy || 'System'}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>{new Date(c.updatedAt).toLocaleString()}</span>
                </div>
                <div style={{ color: '#444', marginLeft: '36px', fontSize: '14px' }}>{c.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OverviewWidgets = ({ loanData }) => {
  // Financial Math for dynamic values
  const principal = Number(loanData?.Request_Loan_Amount ?? 11300);
  const statedRate = Number(loanData?.interestRate ?? 12) / 100;
  const rateType = loanData?.interestRateType || 'Annually';
  const fees = Number(loanData?.underwritingRefinanceFee ?? 0);
  const frequency = loanData?.paymentFrequency || 'Monthly';
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

  const completedCount = Object.keys(loanData?.completedPayments || {}).length;

  const principalRatio = totalOfPayments > 0 ? (principal / totalOfPayments) : 0;
  const interestRatio = totalOfPayments > 0 ? (interestExpense / totalOfPayments) : 0;
  const feesRatio = totalOfPayments > 0 ? (fees / totalOfPayments) : 0;

  const paidPrincipal = completedCount * basePayment * principalRatio;
  const paidInterest = completedCount * basePayment * interestRatio;
  const paidFees = completedCount * basePayment * feesRatio;
  const trueTotalPaid = paidPrincipal + paidInterest + paidFees;

  const totalPaidData = [
    { label: 'Principal', value: Math.max(0, paidPrincipal), color: '#0d6efd' },
    { label: 'Interest', value: Math.max(0, paidInterest), color: '#f97316' }
  ];

  const payoffPrincipal = principal - paidPrincipal;
  const payoffInterest = interestExpense - paidInterest;
  const payoffFees = fees - paidFees;
  const truePayoffAmount = Math.max(0, payoffPrincipal) + Math.max(0, payoffInterest) + Math.max(0, payoffFees);

  const payoffBreakdownData = [
    { label: 'Principal', value: Math.max(0, payoffPrincipal), color: '#0d6efd' },
    { label: 'Interest', value: Math.max(0, payoffInterest), color: '#f97316' },
    { label: 'Standard Fees', value: Math.max(0, payoffFees), color: '#10b981' }
  ];

  // Dummy fallback for empty state to show visual chart (matching mock values)
  const isDummy = trueTotalPaid === 0 && truePayoffAmount === 0;
  const totalPaidAmount = isDummy ? 4432.80 : trueTotalPaid;
  const payoffAmount = isDummy ? 27790.24 : truePayoffAmount;

  if (isDummy) {
    totalPaidData[0].value = 2700;
    totalPaidData[1].value = 1732.80;
    payoffBreakdownData[0].value = 18000;
    payoffBreakdownData[1].value = 9000;
    payoffBreakdownData[2].value = 790.24;
  }

  // Dynamic Summary Values
  let nextDueDateStr = '04/16/2026';
  let nextPaymentAmountVal = 125.46;
  let amountPastDueVal = 13029.30;
  let dateLastCurrentStr = '04/16/2024';

  if (!isDummy) {
    let schedule = loanData?.transactions || [];

    // If loanData doesn't have cached transactions, generate a dynamic baseline schedule for calculation
    if (!schedule.length) {
      const firstDateStr = loanData?.firstPaymentDate;
      if (firstDateStr) {
        let currentDate = new Date(firstDateStr + 'T12:00:00');
        if (isNaN(currentDate.getTime())) currentDate = new Date(firstDateStr);

        for (let i = 1; i <= totalPeriods; i++) {
          const compDate = loanData?.completedPayments?.[i] || null;
          let rowStatus = compDate ? 'Completed' : 'Pending';
          schedule.push({
            period: i,
            date: new Date(currentDate).toLocaleDateString(),
            Status: rowStatus,
            completedDate: compDate,
            payment: basePayment
          });

          if (frequency === 'Weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (frequency === 'Bi-Weekly') {
            currentDate.setDate(currentDate.getDate() + 14);
          } else if (frequency === 'Monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else if (frequency === 'Quarterly') {
            currentDate.setMonth(currentDate.getMonth() + 3);
          } else if (frequency === 'Annually') {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
          }
        }
      }
    }

    if (schedule.length > 0) {
      // 1. Next Due Date & Payment Amount
      const nextPending = schedule.find(t => t.Status === 'Pending');
      if (nextPending) {
        nextDueDateStr = nextPending.date || 'N/A';
        nextPaymentAmountVal = nextPending.payment || basePayment;
      } else {
        nextDueDateStr = 'Fully Paid';
        nextPaymentAmountVal = 0;
      }

      // 2. Amount Past Due 30+ Days
      const today = new Date();
      amountPastDueVal = schedule
        .filter(t => t.Status === 'Pending' && t.date)
        .reduce((sum, t) => {
          const txDate = new Date(t.date);
          const diffDays = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
          // To be perfectly dynamic with standard past due, we check if it passed
          if (diffDays >= 30) return sum + (t.payment || basePayment);
          return sum;
        }, 0);

      // 3. Date Last Current
      const completedList = schedule.filter(t => t.Status === 'Completed');
      if (completedList.length > 0) {
        const lastComp = completedList[completedList.length - 1];
        dateLastCurrentStr = lastComp.completedDate || lastComp.date || 'N/A';
      } else {
        dateLastCurrentStr = 'N/A';
      }
    } else {
      // if still no schedule generated, fallback to basePayment
      nextPaymentAmountVal = basePayment;
      dateLastCurrentStr = 'N/A';
      amountPastDueVal = 0;
    }
  }

  let nextPaymentAmountStr = `$${nextPaymentAmountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let amountPastDueStr = `$${amountPastDueVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="overview-widgets-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>

      {/* Widget 1: Summary */}
      <div className="dashboard-widget" style={{ padding: '24px', minHeight: '350px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>Summary</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>Next Due Date</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{nextDueDateStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>Next Payment Amount</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{nextPaymentAmountStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>Amount Past Due 30+ Days</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{amountPastDueStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>Date Last Current</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{dateLastCurrentStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>Frequency</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{frequency}</div>
          </div>
        </div>
      </div>

      {/* Widget 2: Total Paid */}
      <div className="dashboard-widget" style={{ padding: '24px', minHeight: '350px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#666', cursor: 'pointer' }}>
          <ChevronDown size={14} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>Total Paid</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', color: '#555' }}>Any</span>
          <ChevronDown size={14} color="#666" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
            Principal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
            Interest
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
          <DynamicDonutChart data={totalPaidData} totalValue={totalPaidAmount} />
        </div>
      </div>

      {/* Widget 3: Payoff Breakdown */}
      <div className="dashboard-widget" style={{ padding: '24px', minHeight: '350px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#666', cursor: 'pointer' }}>
          <ChevronDown size={14} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>Payoff Breakdown</h3>

        <div style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input type="text" placeholder="MM/dd/yy" style={{ border: 'none', outline: 'none', color: '#666', width: '100%', fontSize: '13px' }} />
          <Calendar size={14} color="#666" />
        </div>


        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d6efd' }}></div>
            Principal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
            Interest
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#555' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            Standard Fees
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
          <DynamicDonutChart data={payoffBreakdownData} totalValue={payoffAmount} />
        </div>
      </div>

    </div>
  );
};

const OverviewView = ({ loanData, fullName }) => (
  <main className="content-grid">
    {/* LEFT COLUMN */}
    <div className="left-column">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-large">
            <User size={32} />
          </div>
          <div className="profile-info">
            <h2>{fullName} (Sample)</h2>
            <a href={`mailto:${loanData.email}`} className="email">{loanData.email}</a>
            <span className="badge-status">Engineering</span>
          </div>
          <Settings size={16} color="#666" style={{ cursor: 'pointer', marginLeft: 'auto' }} />
        </div>

        <div className="contact-list">
          <div className="contact-item">
            <Phone size={14} color="#666" />
            <span>{loanData.phone || loanData.mobile}</span>
          </div>
          <div className="contact-item">
            <MapPin size={14} color="#666" />
            <span>{loanData.dateOfBirth ? new Date().getFullYear() - new Date(loanData.dateOfBirth).getFullYear() : 'N/A'} years | {loanData.gender}</span>
          </div>
          <div className="contact-item">
            <FileText size={14} color="#666" />
            <span>SSN: {loanData.social_Security_Code || loanData.ssn}</span>
          </div>
          <div className="contact-item">
            <span style={{ width: 14, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#007bff' }}>S</span>
            <span style={{ color: '#007bff' }}>{loanData.firstName}_{loanData.lastName.toLowerCase()}</span>
          </div>
          <div className="action-link">Invite to Portal</div>
        </div>
      </div>

      {/* Address Section */}
      <div className="info-section">
        <div className="section-title">
          <span>ADDRESS</span>
          <ChevronDown size={14} />
        </div>

        <div className="address-box">
          <div style={{ marginBottom: 16 }}>
            <div className="address-title">Billing Address</div>
            <div className="address-text">
              {loanData.Primary_Address || loanData.address}<br />
              {loanData.Primary_Address_State || loanData.state}, {loanData.Primary_Address_Zip_Code || loanData.zipCode}<br />
              {loanData.Primary_Address_Country || 'United States'}
            </div>
            <Edit size={12} color="#666" style={{ marginTop: 4, cursor: 'pointer' }} />
          </div>

          <div>
            <div className="address-title">Shipping Address</div>
            <div className="link-action" style={{ marginTop: 0 }}>+ Add Shipping Address</div>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="section-title">
          <span>OTHER DETAILS</span>
          <ChevronDown size={14} />
        </div>
        <div className="contact-list">
          <div className="contact-item"><span>Self Employed: {loanData.selfEmployee}</span></div>
          <div className="contact-item"><span>Income: ${loanData.income}</span></div>
        </div>
      </div>
    </div>

    {/* RIGHT COLUMN */}
    <div className="right-column">
      <div className="dashboard-widget">
        <div className="widget-title">
          <span style={{ color: '#6f42c1' }}>✨ WHAT'S NEXT?</span>
        </div>
        <div className="whats-next-content">
          Create an <strong>invoice</strong> or a <strong>quote</strong> and send it to your customer.
        </div>
        <div className="action-buttons-row">
          <button className="btn-primary">New Invoice</button>
          <button className="btn-secondary">New Quote</button>
          <MoreHorizontal size={16} color="#666" style={{ alignSelf: 'center', cursor: 'pointer' }} />
        </div>
      </div>

      <div className="due-period">Payment due period</div>
      <div className="due-period-value">Due on Receipt</div>
      <div style={{ height: 20 }}></div>

      <div className="dashboard-widget">
        <div className="widget-title">Receivables</div>
        <table className="receivables-table">
          <thead>
            <tr>
              <th>CURRENCY</th>
              <th className="amount">OUTSTANDING RECEIVABLES</th>
              <th className="amount">UNUSED CREDITS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>USD - United States Dollar</td>
              <td className="amount">$0.00</td>
              <td className="amount">$0.00</td>
            </tr>
            <tr className="total-row">
              <td>TOTAL (USD)</td>
              <td className="amount" style={{ color: '#333' }}>${loanData.Request_Loan_Amount} ({loanData.loanPurpose})</td>
              <td className="amount">$0.00</td>
            </tr>
          </tbody>
        </table>
        <div className="link-action">Enter Opening Balance</div>
      </div>

      <div className="dashboard-widget">
        <div className="widget-title">Income <span style={{ fontWeight: 'normal', color: '#888', fontSize: 12, marginLeft: 8 }}>This chart is displayed in user's base currency.</span></div>
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13, border: '1px dashed #ddd' }}>
          Chart Placeholder
        </div>
      </div>
    </div>
  </main>
);


const TransactionsView = ({
  loanData,
  setupDetails,
  availableStates,
  isEditingSetup,
  setIsEditingSetup,
  handleSetupChange,
  handleSaveSetup
}) => {
  const [completedPayments, setCompletedPayments] = React.useState(loanData?.completedPayments || {});
  const [customPaymentDates, setCustomPaymentDates] = React.useState({});
  const [editingPeriod, setEditingPeriod] = React.useState(null);
  const [tempDate, setTempDate] = React.useState('');
  const [tempPaymentDate, setTempPaymentDate] = React.useState('');

  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const principal = Number(loanData?.Request_Loan_Amount ?? 11300);
  const statedRate = Number(loanData?.interestRate ?? 12) / 100;
  const rateType = loanData?.interestRateType || 'Annually';
  const fees = Number(loanData?.underwritingRefinanceFee ?? 0);
  const frequency = loanData?.paymentFrequency || 'Monthly';

  // Treat rate dynamically based on Annually/Monthly selection
  const annualInterestRate = rateType === 'Monthly' ? statedRate * 12 : statedRate;

  // Assume 5 year term for now since not present in the schema
  const termYears = 5;
  let periodsPerYear = 12;
  if (frequency === 'Weekly') periodsPerYear = 52;
  if (frequency === 'Bi-Weekly') periodsPerYear = 26;
  if (frequency === 'Quarterly') periodsPerYear = 4;
  if (frequency === 'Annually') periodsPerYear = 1;

  const totalPeriods = termYears * periodsPerYear;
  const termDays = termYears * 365;

  // Simple Flat Interest calculation mapping to user's formula
  const interestExpense = principal * annualInterestRate * termYears;
  const financeCharge = interestExpense + fees;
  const totalOfPayments = principal + financeCharge;

  // Formula from user: ( (Interest Expense + Total Fees) / Loan Principal ) / Number of Days in Loan Term ) x 365 Days
  const calculatedAPR = principal > 0 ? ((financeCharge / principal) / termDays) * 365 * 100 : 0;
  const basePayment = totalPeriods > 0 ? totalOfPayments / totalPeriods : 0;

  const generateSchedule = () => {
    const firstDateStr = setupDetails?.firstPaymentDate || loanData?.firstPaymentDate;
    if (!firstDateStr) return [];

    let currentDate = new Date(firstDateStr + 'T12:00:00');
    if (isNaN(currentDate.getTime())) {
      currentDate = new Date(firstDateStr);
    }

    let schedule = [];
    for (let i = 1; i <= totalPeriods; i++) {
      const compDate = completedPayments[i] || null;
      let rowStatus = compDate ? 'Completed' : 'Pending';

      const dbDate = loanData?.transactions?.find(t => t.period === i)?.date;
      const calcDate = new Date(currentDate).toLocaleDateString();
      const activeDate = customPaymentDates[i] || dbDate || calcDate;

      schedule.push({
        period: i,
        date: activeDate,
        Status: rowStatus,
        completedDate: compDate,
        payment: basePayment
      });

      if (frequency === 'Weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'Bi-Weekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (frequency === 'Monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (frequency === 'Quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else if (frequency === 'Annually') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }
    return schedule;
  };

  const schedule = generateSchedule();

  return (
    <div className="transactions-tab-content" style={{ padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
      {/* SUMMARY PANEL */}
      <div className="dashboard-widget" style={{ marginBottom: '24px', borderTop: '4px solid #6f42c1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Transaction Summary</span>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc3545', borderColor: '#ffc107', backgroundColor: '#fff8e1' }}>
            <Activity size={14} /> Inactivate
          </button>
        </div>

        {/* Dynamic Cards Layout instead of plain text */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #007bff' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Percent size={14} color="#007bff" /> APR
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>{calculatedAPR.toFixed(4)}%</div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #dc3545' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} color="#dc3545" /> Finance Charge
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>${financeCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #28a745' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} color="#28a745" /> Amount Financed
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>${principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #6f42c1' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} color="#6f42c1" /> Total of Payments
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>${totalOfPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #fd7e14' }}>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#fd7e14" /> Total Sales Price
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>${totalOfPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

        </div>

        <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #ffeeba' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 500, color: '#856404' }}>
            <span style={{ backgroundColor: '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{totalPeriods - 1 > 0 ? totalPeriods - 1 : 0}</span>
            <span>{frequency} payment(s) of</span>
            <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>${(basePayment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 500, color: '#856404' }}>
            <span style={{ backgroundColor: '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', minWidth: '35px', textAlign: 'center' }}>{totalPeriods > 0 ? 1 : 0}</span>
            <span>{frequency} payment(s) of</span>
            <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>${(basePayment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', backgroundColor: '#6f42c1', border: 'none' }}>
            View Payments <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* LOAN SETUP PANEL */}
      <div className="dashboard-widget" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Loan Setup Details</span>
          {!isEditingSetup && (
            <button
              className="btn-secondary"
              onClick={() => setIsEditingSetup(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit size={14} /> Edit Setup
            </button>
          )}
        </div>

        {/* Inner Tabs - styled like pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '24px' }}>
          {['LOAN TERMS', 'ESCROW CALCULATOR', 'ADDITIONAL INFORMATION', 'ADVANCED CONFIGURATION', 'LATE FEE CONFIGURATION'].map((tab, i) => (
            <div key={tab} style={{
              fontSize: '11px',
              fontWeight: 600,
              color: i === 0 ? '#fff' : '#555',
              backgroundColor: i === 0 ? '#007bff' : '#f0f0f0',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: i === 0 ? '0 2px 4px rgba(0,123,255,0.3)' : 'none'
            }}>
              {tab}
            </div>
          ))}
        </div>

        {isEditingSetup ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px' }}>
            {/* Editable Form Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '40px', marginBottom: '24px' }}>

              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '120px', fontSize: '12px', color: '#555', textAlign: 'right' }}>Total Amount</span>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <span style={{ padding: '8px 12px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc', color: '#555' }}>$</span>
                    <input
                      type="number"
                      name="Request_Loan_Amount"
                      value={setupDetails.Request_Loan_Amount}
                      onChange={handleSetupChange}
                      style={{ border: 'none', padding: '8px', flex: 1, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '120px', fontSize: '12px', color: '#555', textAlign: 'right' }}>State</span>
                  <div style={{ flex: 1 }}>
                    <select
                      name="Primary_Address_State"
                      value={setupDetails.Primary_Address_State}
                      onChange={handleSetupChange}
                      style={{ width: '100%', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="">Select State</option>
                      {availableStates.map(state => (
                        <option key={state._id} value={state.name}>{state.name}</option>
                      ))}
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 12px 136px', fontSize: '12px', color: '#333' }}>Interest rate</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <span style={{ width: '120px', fontSize: '12px', color: '#555', textAlign: 'right', marginTop: '8px' }}>Interest Rate</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="number"
                          name="interestRate"
                          value={setupDetails.interestRate}
                          onChange={handleSetupChange}
                          style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', flex: 1, outline: 'none' }}
                        />
                        <select
                          name="interestRateType"
                          value={setupDetails.interestRateType}
                          onChange={handleSetupChange}
                          style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', flex: 1, outline: 'none', backgroundColor: '#fff' }}
                        >
                          <option value="Annually">Annually</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {setupDetails.Request_Loan_Amount > 0 && setupDetails.interestRate > 0 && (
                          <span style={{ fontSize: '11px', color: '#666', display: 'block' }}>
                            Est. Interest: ${(Number(setupDetails.Request_Loan_Amount) * Number(setupDetails.interestRate) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {availableStates.find(s => s.name === setupDetails.Primary_Address_State) && (
                          <span style={{ fontSize: '11px', color: '#007bff' }}>
                            State Rule: {availableStates.find(s => s.name === setupDetails.Primary_Address_State)?.interestRate || 12}%
                          </span>
                        )}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="tierInterestRate"
                          checked={setupDetails.tierInterestRate}
                          onChange={handleSetupChange}
                        /> tier interest rate
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '120px', fontSize: '14px', color: '#555', textAlign: 'right' }}>Contract Date</span>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <input
                      type="date"
                      name="contractDate"
                      value={setupDetails.contractDate}
                      onChange={handleSetupChange}
                      style={{ border: 'none', padding: '8px', flex: 1, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ width: '120px', fontSize: '14px', color: '#555', textAlign: 'right', marginTop: '8px' }}>First Payment Date</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Days in 1st period: 31<br />Unit periods: 1 Odd days: 0</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                        <input
                          type="date"
                          name="firstPaymentDate"
                          value={setupDetails.firstPaymentDate}
                          onChange={handleSetupChange}
                          style={{ border: 'none', padding: '8px', flex: 1, outline: 'none' }}
                        />
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }}><Plus size={16} /></button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#007bff', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <span style={{ cursor: 'pointer' }}>+30</span> |
                      <span style={{ cursor: 'pointer' }}>+45</span> |
                      <span style={{ cursor: 'pointer' }}>+60</span> |
                      <span style={{ cursor: 'pointer' }}>+90</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '160px', fontSize: '14px', color: '#555', textAlign: 'right' }}>Discount</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                      <span style={{ padding: '8px 12px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc', color: '#555' }}>$</span>
                      <input
                        type="number"
                        name="discount"
                        value={setupDetails.discount}
                        onChange={handleSetupChange}
                        style={{ border: 'none', padding: '8px', flex: 1, outline: 'none' }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#007bff', cursor: 'pointer' }}>show %</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '160px', fontSize: '14px', color: '#555', textAlign: 'right' }}>Underwriting/Refinance<br />Fee</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                      <span style={{ padding: '8px 12px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ccc', color: '#555' }}>$</span>
                      <input
                        type="number"
                        name="underwritingRefinanceFee"
                        value={setupDetails.underwritingRefinanceFee}
                        onChange={handleSetupChange}
                        style={{ border: 'none', padding: '8px', flex: 1, outline: 'none' }}
                      />
                    </div>
                    {setupDetails.Primary_Address_State && availableStates.some(s => s.name === setupDetails.Primary_Address_State) && (
                      <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>
                        (Calculated at {availableStates.find(s => s.name === setupDetails.Primary_Address_State)?.originationFees}% of Amount)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '160px', fontSize: '12px', color: '#555', textAlign: 'right' }}>Payment Frequency</span>
                  <select
                    name="paymentFrequency"
                    value={setupDetails.paymentFrequency}
                    onChange={handleSetupChange}
                    style={{ flex: 1, border: '1px solid #ccc', padding: '8px', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <button className="btn-secondary" style={{ padding: '10px 24px' }} onClick={() => setIsEditingSetup(false)}>Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ padding: '10px 24px' }}>Next</button>
                <button className="btn-primary" onClick={handleSaveSetup} style={{ padding: '10px 24px', backgroundColor: '#1a1a1a', border: 'none' }}>Save & Calculate</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '40px' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Total Amount', value: `$${Number(loanData?.Request_Loan_Amount || 11300).toFixed(2)}`, icon: DollarSign, color: '#28a745' },
                { label: 'Interest Rate', value: `${loanData?.interestRate || 12}% (${loanData?.interestRateType || 'Annually'})`, icon: Percent, color: '#dc3545' },
                { label: 'Interest Rate Method', value: 'Fixed', icon: Settings, color: '#6c757d' },
                { label: 'Contract Date', value: loanData?.contractDate ? new Date(loanData.contractDate).toLocaleDateString() : 'N/A', icon: Calendar, color: '#17a2b8' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={16} color={item.color} />
                    </div>
                    {item.label}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `#6f42c115`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="#6f42c1" />
                  </div>
                  First Payment Date
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{loanData?.firstPaymentDate ? new Date(loanData.firstPaymentDate).toLocaleDateString() : 'N/A'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', background: '#f8f9fa', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#666', fontSize: '11px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}><span>Days in 1st period:</span> <strong>31</strong></div>
                    <div style={{ color: '#666', fontSize: '11px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}><span>Unit periods:</span> <strong>1</strong></div>
                    <div style={{ color: '#666', fontSize: '11px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}><span>Odd days:</span> <strong>0</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Discount', value: `$${Number(loanData?.discount || 0).toFixed(2)}`, icon: DollarSign, color: '#28a745' },
                { label: 'Underwriting/Refinance Fee', value: `$${Number(loanData?.underwritingRefinanceFee || 0).toFixed(2)}`, icon: FileText, color: '#17a2b8' },
                { label: 'Term', value: '60 Months', icon: Settings, color: '#fd7e14' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', ...(idx === 2 ? { marginTop: '8px', order: 4 } : { order: idx }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={16} color={item.color} />
                    </div>
                    {item.label}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', order: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `#007bff15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={16} color="#007bff" />
                  </div>
                  Payment Frequency
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{loanData?.paymentFrequency || 'Monthly'}</div>
                  <div style={{ marginTop: '8px', background: '#f8f9fa', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#666', fontSize: '11px', marginBottom: '4px' }}>Force APR Calc Single Frequency:</div>
                    <div style={{ fontWeight: 700, fontSize: '11px', color: '#dc3545', textAlign: 'right' }}>No</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TRANSACTIONS LIST PANEL */}
      <div className="dashboard-widget" style={{ marginTop: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Transactions List</span>
        </div>
        {schedule.length > 0 ? (
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600 }}>Period</th>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600 }}>Payment Date</th>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600 }}>Completed Date</th>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600, textAlign: 'right' }}>Payment Amount</th>
                  <th style={{ padding: '12px 16px', color: '#495057', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.period} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px 16px', color: '#333' }}>{row.period}</td>
                    <td style={{ padding: '12px 16px', color: '#333' }}>
                      {editingPeriod === row.period ? (
                        <input
                          type="date"
                          value={tempPaymentDate}
                          onChange={(e) => setTempPaymentDate(e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                      ) : (
                        row.date || '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: row.Status === 'Completed' ? 600 : 'normal', color: row.Status === 'Completed' ? '#28a745' : '#666', fontStyle: row.Status === 'Pending' ? 'italic' : 'normal' }}>
                      {row.Status}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#666', fontStyle: row.completedDate ? 'normal' : 'italic' }}>
                      {editingPeriod === row.period ? (
                        <input
                          type="date"
                          value={tempDate}
                          onChange={(e) => setTempDate(e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                          autoFocus
                        />
                      ) : (
                        row.completedDate ? row.completedDate : '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#333', textAlign: 'right', fontWeight: 500 }}>
                      ${(row.payment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {editingPeriod === row.period ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            className="btn-primary"
                            onClick={async () => {
                              const previousSchedule = schedule;
                              const previousLoanData = loanData;
                              const previousCompletedPayments = completedPayments;
                              const previousCustomPaymentDates = customPaymentDates;

                              let updatedCompletedPayments = { ...completedPayments };
                              if (tempDate) {
                                updatedCompletedPayments[row.period] = tempDate;
                              } else {
                                delete updatedCompletedPayments[row.period];
                              }

                              let updatedCustomPaymentDates = { ...customPaymentDates };
                              if (tempPaymentDate) {
                                updatedCustomPaymentDates[row.period] = tempPaymentDate;
                              }

                              setCompletedPayments(updatedCompletedPayments);
                              setCustomPaymentDates(updatedCustomPaymentDates);
                              setEditingPeriod(null);

                              const updatedSchedule = schedule.map(r => {
                                let newDate = r.date;
                                if (r.period === row.period && tempPaymentDate) {
                                  const [y, m, d] = tempPaymentDate.split('-');
                                  newDate = new Date(y, m - 1, d).toLocaleDateString();
                                }
                                return {
                                  ...r,
                                  Status: updatedCompletedPayments[r.period] ? 'Completed' : 'Pending',
                                  completedDate: updatedCompletedPayments[r.period] || null,
                                  date: newDate
                                };
                              });

                              // Optimistic update: refresh local schedule view
                              setLoanData(prev => ({ ...prev, transactions: updatedSchedule, completedPayments: updatedCompletedPayments }));

                              try {
                                const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  },
                                  body: JSON.stringify({
                                    completedPayments: updatedCompletedPayments,
                                    transactions: updatedSchedule
                                  })
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  setLoanData(data);
                                  if (data.mailSent) {
                                    alert("Mail Sent Successfully! Logged in Database bounds.");
                                  } else {
                                    alert("Transaction Saved Successfully!");
                                  }
                                } else {
                                  // Revert on failure
                                  setLoanData(previousLoanData);
                                  setCompletedPayments(previousCompletedPayments);
                                  setCustomPaymentDates(previousCustomPaymentDates);
                                  if (response.status === 403 || response.status === 401) {
                                    alert("Security Session Expired: Please Log Out and Log Back In to save transactions.");
                                  } else {
                                    alert("Failed to save completed payment to database.");
                                  }
                                }
                              } catch (err) {
                                console.error("Error saving completed payment:", err);
                                setLoanData(previousLoanData);
                                setCompletedPayments(previousCompletedPayments);
                                setCustomPaymentDates(previousCustomPaymentDates);
                                alert("Connection error while saving transaction");
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#28a745', border: 'none' }}
                          >
                            Save
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => setEditingPeriod(null)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditingPeriod(row.period);
                            setTempDate(row.completedDate ? formatForInput(row.completedDate) : '');
                            setTempPaymentDate(row.date ? formatForInput(row.date) : '');
                          }}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', margin: '0 auto', gap: '4px' }}
                        >
                          <Edit size={12} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            No transactions list available. Please set the First Payment Date and Frequency.
          </div>
        )}
      </div>
    </div>
  );
};


const BankingView = ({
  loanData,
  activeTab,
  setActiveTab,
  isAddingAccount,
  setIsAddingAccount,
  nameOnAccount,
  setNameOnAccount,
  accountNumber,
  setAccountNumber,
  routingNumber,
  handleRoutingNumberChange,
  bankName,
  setBankName,
  address,
  setAddress,
  zipCode,
  handleZipChange,
  city,
  setCity,
  stateName,
  setStateName,
  country,
  setCountry,
  clearForm,
  handleBankingSubmit,
  handleMakeDefault,
  handleDeleteAccount,
  handleEditAccountClick
}) => {
  const existingAccounts = Array.isArray(loanData?.bankingDetails) ? loanData.bankingDetails : loanData?.bankingDetails ? [loanData.bankingDetails] : [];
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const currentAccounts = existingAccounts.filter(acc => acc.accountType === activeTab);

  return (
    <div className="uploads-tab-content">
      <div className="dashboard-widget">
        <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeTab.toUpperCase()} DETAILS</span>
          {!isAddingAccount && (
            <button className="btn-primary" onClick={() => setIsAddingAccount(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px' }}>
              <Plus size={14} /> Add Account
            </button>
          )}
        </div>

        {isAddingAccount ? (
          <div style={{ padding: '20px 0', textAlign: 'left' }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
              Payment information is protected by <strong>Secure Payments™</strong>. Please fill out the below form and click "Submit".
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Account Type</label>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '16px', color: '#666', outline: 'none', backgroundColor: 'transparent' }}
                  >
                    <option value="Checking Account">Checking Account</option>
                    <option value="Saving Account">Saving Account</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Name on account</label>
                  <input type="text" value={nameOnAccount} onChange={(e) => setNameOnAccount(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Account number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Routing number</label>
                  <input type="text" value={routingNumber} onChange={handleRoutingNumberChange} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Bank name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>ZIP Code</label>
                  <input type="text" value={zipCode} onChange={handleZipChange} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>State</label>
                  <select value={stateName} onChange={(e) => setStateName(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '16px', outline: 'none', backgroundColor: 'transparent' }}>
                    <option value="Alabama">Alabama</option>
                    <option value="Alaska">Alaska</option>
                    <option value="Arizona">Arizona</option>
                    <option value="Arkansas">Arkansas</option>
                    <option value="California">California</option>
                    <option value="Colorado">Colorado</option>
                    <option value="Connecticut">Connecticut</option>
                    <option value="Delaware">Delaware</option>
                    <option value="Florida">Florida</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Hawaii">Hawaii</option>
                    <option value="Idaho">Idaho</option>
                    <option value="Illinois">Illinois</option>
                    <option value="Indiana">Indiana</option>
                    <option value="Iowa">Iowa</option>
                    <option value="Kansas">Kansas</option>
                    <option value="Kentucky">Kentucky</option>
                    <option value="Louisiana">Louisiana</option>
                    <option value="Maine">Maine</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Massachusetts">Massachusetts</option>
                    <option value="Michigan">Michigan</option>
                    <option value="Minnesota">Minnesota</option>
                    <option value="Mississippi">Mississippi</option>
                    <option value="Missouri">Missouri</option>
                    <option value="Montana">Montana</option>
                    <option value="Nebraska">Nebraska</option>
                    <option value="Nevada">Nevada</option>
                    <option value="New Hampshire">New Hampshire</option>
                    <option value="New Jersey">New Jersey</option>
                    <option value="New Mexico">New Mexico</option>
                    <option value="New York">New York</option>
                    <option value="North Carolina">North Carolina</option>
                    <option value="North Dakota">North Dakota</option>
                    <option value="Ohio">Ohio</option>
                    <option value="Oklahoma">Oklahoma</option>
                    <option value="Oregon">Oregon</option>
                    <option value="Pennsylvania">Pennsylvania</option>
                    <option value="Rhode Island">Rhode Island</option>
                    <option value="South Carolina">South Carolina</option>
                    <option value="South Dakota">South Dakota</option>
                    <option value="Tennessee">Tennessee</option>
                    <option value="Texas">Texas</option>
                    <option value="Utah">Utah</option>
                    <option value="Vermont">Vermont</option>
                    <option value="Virginia">Virginia</option>
                    <option value="Washington">Washington</option>
                    <option value="West Virginia">West Virginia</option>
                    <option value="Wisconsin">Wisconsin</option>
                    <option value="Wyoming">Wyoming</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: '#336699' }}>Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ padding: '8px 0', border: 'none', borderBottom: '1px solid #ccc', fontSize: '16px', outline: 'none', backgroundColor: 'transparent' }}>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button className="btn-secondary" onClick={() => { setIsAddingAccount(false); clearForm(); }} style={{ padding: '8px 20px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button className="btn-primary" onClick={handleBankingSubmit} style={{ padding: '8px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        ) : currentAccounts.length > 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {currentAccounts.map((acc, idx) => (
              <div key={idx} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '30px', backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '1px solid #eef2f6' }}>

                {/* Three Dot Action Menu */}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  <MoreVertical
                    size={18}
                    color="#666"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpenMenuId(openMenuId === acc._id ? null : acc._id)}
                  />
                  {openMenuId === acc._id && (
                    <div style={{ position: 'absolute', top: '24px', right: '0', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10, width: '120px' }}>
                      <div
                        onClick={() => { handleEditAccountClick(acc); setOpenMenuId(null); }}
                        style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      >Edit Form...</div>
                      <div
                        onClick={() => { handleDeleteAccount(acc._id); setOpenMenuId(null); }}
                        style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#dc3545' }}
                      >Delete Profile</div>
                      <div
                        onClick={() => { handleMakeDefault(acc._id); setOpenMenuId(null); }}
                        style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', fontWeight: acc.isDefault ? 'bold' : 'normal', color: acc.isDefault ? '#28a745' : '#333' }}
                      >{acc.isDefault ? 'Defaulted ✓' : 'Make Default'}</div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Account Type {acc.isDefault && <span style={{ color: '#28a745', fontWeight: 'bold' }}>(Default)</span>}</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>{acc.accountType}</div>

                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Name on Account</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>{acc.nameOnAccount}</div>

                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Account Number</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>****{acc.accountNumber?.slice(-4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Routing Number</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>{acc.routingNumber}</div>

                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Bank Name</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>{acc.bankName}</div>

                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Address</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '16px' }}>{acc.address}, {acc.city}, {acc.stateName} {acc.zipCode}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            <h3>No {activeTab} Added Yet</h3>
            <p>Click "Add Account" to configure your banking credentials for {activeTab.toLowerCase()}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function ParticularLoanPage() {



  const location = useLocation();
  const navigate = useNavigate();
  const [loanData, setLoanData] = React.useState(location.state?.loanData || null);
  const initialLoanId = location.state?.loanId; // Support for older dashboard builds
  const [activeTab, setActiveTab] = React.useState('Overview');
  const [isUploading, setIsUploading] = React.useState(false);
  const [showBankingDropdown, setShowBankingDropdown] = React.useState(false);
  const [isAddingAccount, setIsAddingAccount] = React.useState(false);
  const [isEditingSetup, setIsEditingSetup] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Loan Setup Details State
  const [setupDetails, setSetupDetails] = React.useState({
    interestRate: loanData?.interestRate || 12,
    interestRateType: loanData?.interestRateType || 'Annually',
    tierInterestRate: loanData?.tierInterestRate || false,
    contractDate: loanData?.contractDate ? new Date(loanData.contractDate).toISOString().split('T')[0] : '',
    firstPaymentDate: loanData?.firstPaymentDate ? new Date(loanData.firstPaymentDate).toISOString().split('T')[0] : '',
    discount: loanData?.discount || 0,
    underwritingRefinanceFee: loanData?.underwritingRefinanceFee || 0,
    paymentFrequency: loanData?.paymentFrequency || 'Monthly',
    Request_Loan_Amount: loanData?.Request_Loan_Amount || 0,
    Primary_Address_State: loanData?.Primary_Address_State || ''
  });

  const [availableStates, setAvailableStates] = React.useState([]);

  // Fetch approved states for calculations
  React.useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(getApiUrl('/api/states'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableStates(data.filter(s => s.status === 'Approved'));
        }
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []);

  React.useEffect(() => {
    const fetchFreshData = async (id) => {
      try {
        setError(null);
        const response = await fetch(getApiUrl(`/api/loans/${id}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Server returned non-JSON response:", text.slice(0, 200));
          throw new Error(`Server Error: Expected JSON but received ${contentType || 'unknown'}. Please check backend routing.`);
        }

        const freshData = await response.json();
        setLoanData(freshData);
        setSetupDetails(prev => ({
          ...prev,
          interestRate: freshData?.interestRate || prev.interestRate,
          interestRateType: freshData?.interestRateType || prev.interestRateType,
          tierInterestRate: freshData?.tierInterestRate || prev.tierInterestRate,
          contractDate: freshData?.contractDate ? new Date(freshData.contractDate).toISOString().split('T')[0] : prev.contractDate,
          firstPaymentDate: freshData?.firstPaymentDate ? new Date(freshData.firstPaymentDate).toISOString().split('T')[0] : prev.firstPaymentDate,
          discount: freshData?.discount || prev.discount,
          underwritingRefinanceFee: freshData?.underwritingRefinanceFee || prev.underwritingRefinanceFee,
          paymentFrequency: freshData?.paymentFrequency || prev.paymentFrequency,
          Request_Loan_Amount: freshData?.Request_Loan_Amount || prev.Request_Loan_Amount,
          Primary_Address_State: freshData?.Primary_Address_State || prev.Primary_Address_State
        }));
      } catch (err) {
        console.error("Error fetching fresh loan data on mount:", err);
        setError(err.message);
      }
    };
    if (loanData?._id) fetchFreshData(loanData._id);
    else if (initialLoanId) fetchFreshData(initialLoanId);
  }, [initialLoanId]);

  const handleSetupChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isAmount = name === 'Request_Loan_Amount';
    const isState = name === 'Primary_Address_State';

    setSetupDetails(prev => {
      const updates = { ...prev, [name]: type === 'checkbox' ? checked : value };

      const targetState = isState ? value : prev.Primary_Address_State;
      const targetAmount = isAmount ? Number(value) : Number(prev.Request_Loan_Amount);

      const stateConfig = availableStates.find(s => s.name === targetState);

      if (stateConfig) {
        if (isState) {
          updates.interestRate = stateConfig.interestRate || 12;
        }
        if (isAmount || isState) {
          const feePercent = stateConfig.originationFees || 0;
          updates.underwritingRefinanceFee = (targetAmount * feePercent) / 100;
        }
      }

      return updates;
    });
  };

  const handleSaveSetup = async () => {
    // Optimistic update: assume success
    const previousLoanData = loanData;
    setIsEditingSetup(false);
    
    // We update local state so the calculations refresh instantly
    // Transactions being cleared forces a recount which happens in the list renderer
    setLoanData(prev => ({
      ...prev,
      ...setupDetails,
      transactions: [],
      completedPayments: {}
    }));

    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...setupDetails,
          transactions: [], // Clear cached schedule to force date recount
          completedPayments: {}
        })
      });
      if (response.ok) {
        const updatedLoan = await response.json();
        setLoanData(updatedLoan);
        if (updatedLoan.mailSent) {
          alert("Mail Sent Successfully! Logged in Database bounds.");
        } else {
          // No alert needed for success to keep it smooth
        }
      } else {
        setLoanData(previousLoanData);
        setIsEditingSetup(true);
        alert('Failed to save details');
      }
    } catch (err) {
      console.error(err);
      setLoanData(previousLoanData);
      setIsEditingSetup(true);
      alert('Error saving details. Check connection.');
    }
  };

  const [nameOnAccount, setNameOnAccount] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [routingNumber, setRoutingNumber] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [address, setAddress] = React.useState('');

  const [zipCode, setZipCode] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateName, setStateName] = React.useState('');
  const [country, setCountry] = React.useState('United States');

  const handleZipChange = async (e) => {
    const val = e.target.value;
    setZipCode(val);

    if (val.length === 5 && !isNaN(val)) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${val}`);
        if (response.ok) {
          const data = await response.json();
          setCity(data.places[0]['place name']);
          setStateName(data.places[0]['state']);
          setCountry('United States');
        }
      } catch (error) {
        console.error("Error fetching zip data:", error);
      }
    }
  };

  const handleRoutingNumberChange = async (e) => {
    const val = e.target.value;
    setRoutingNumber(val);

    if (val.length === 9 && !isNaN(val)) {
      try {
        const response = await fetch(`https://corsproxy.io/?https://www.routingnumbers.info/api/data.json?rn=${val}`);

        let data;
        if (response.ok) {
          const textResponse = await response.text();
          try {
            data = JSON.parse(textResponse);
          } catch (parseErr) {
            console.warn("API returned non-JSON. Falling back to mock data.");
          }
        }

        if (data && data.code === 200) {
          setBankName(data.customer_name);
        } else {
          setBankName('Bank not found');
        }
      } catch (error) {
        console.error("Error fetching routing number data:", error);
      }
    }
  };

  const [editingBankId, setEditingBankId] = React.useState(null);

  const handleMakeDefault = async (accountId) => {
    // Optimistic update: assume success
    const previousLoanData = loanData;
    const existingAccounts = Array.isArray(loanData?.bankingDetails) ? loanData.bankingDetails : loanData?.bankingDetails ? [loanData.bankingDetails] : [];
    const updatedAccounts = existingAccounts.map(acc => ({
      ...acc,
      isDefault: acc._id === accountId
    }));
    setLoanData(prev => ({ ...prev, bankingDetails: updatedAccounts }));

    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bankingDetails: updatedAccounts })
      });
      if (response.ok) {
        setLoanData(await response.json());
      } else {
        setLoanData(previousLoanData);
        alert("Failed to update default account");
      }
    } catch (err) { 
      console.error(err);
      setLoanData(previousLoanData);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    // Optimistic update: assume success
    const previousLoanData = loanData;
    const existingAccounts = Array.isArray(loanData?.bankingDetails) ? loanData.bankingDetails : loanData?.bankingDetails ? [loanData.bankingDetails] : [];
    const updatedAccounts = existingAccounts.filter(acc => acc._id !== accountId);
    setLoanData(prev => ({ ...prev, bankingDetails: updatedAccounts }));

    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bankingDetails: updatedAccounts })
      });
      if (response.ok) {
        setLoanData(await response.json());
      } else {
        setLoanData(previousLoanData);
        alert("Failed to delete account");
      }
    } catch (err) { 
      console.error(err);
      setLoanData(previousLoanData);
    }
  };

  const handleEditAccountClick = (acc) => {
    setEditingBankId(acc._id);
    setNameOnAccount(acc.nameOnAccount || '');
    setAccountNumber(acc.accountNumber || '');
    setRoutingNumber(acc.routingNumber || '');
    setBankName(acc.bankName || '');
    setAddress(acc.address || '');
    setZipCode(acc.zipCode || '');
    setCity(acc.city || '');
    setStateName(acc.stateName || 'Alabama');
    setCountry(acc.country || 'United States');
    setIsAddingAccount(true);
  };

  const clearForm = () => {
    setEditingBankId(null);
    setNameOnAccount('');
    setAccountNumber('');
    setRoutingNumber('');
    setBankName('');
    setAddress('');
    setZipCode('');
    setCity('');
    setStateName('Alabama');
    setCountry('United States');
  };

  const handleBankingSubmit = async () => {
    // Optimistic update
    const previousLoanData = loanData;
    const existingAccounts = Array.isArray(loanData?.bankingDetails) ? loanData.bankingDetails : loanData?.bankingDetails ? [loanData.bankingDetails] : [];
    let updatedBankingArray;

    const newAccountData = {
      accountType: activeTab,
      nameOnAccount,
      accountNumber,
      routingNumber,
      bankName,
      address,
      zipCode,
      city,
      stateName,
      country,
      _id: editingBankId || `temp-${Date.now()}` // Temporary ID for list rendering
    };

    if (editingBankId) {
      updatedBankingArray = existingAccounts.map(acc =>
        acc._id === editingBankId ? { ...acc, ...newAccountData } : acc
      );
    } else {
      updatedBankingArray = [
        ...existingAccounts,
        { ...newAccountData, isDefault: existingAccounts.length === 0 }
      ];
    }

    // Update UI instantly
    setLoanData(prev => ({ ...prev, bankingDetails: updatedBankingArray }));
    setIsAddingAccount(false);
    clearForm();

    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bankingDetails: updatedBankingArray.map(acc => {
          const { ...rest } = acc;
          if (typeof rest._id === 'string' && rest._id.startsWith('temp-')) delete rest._id;
          return rest;
        })})
      });

      if (response.ok) {
        const updatedLoan = await response.json();
        setLoanData(updatedLoan);
      } else {
        // Revert UI on failure
        setLoanData(previousLoanData);
        setIsAddingAccount(true);
        alert('Failed to save banking details');
      }
    } catch (err) {
      console.error(err);
      setLoanData(previousLoanData);
      setIsAddingAccount(true);
      alert('Error saving banking details. Check connection.');
    }
  };

  if (!loanData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No loan data found</h2>
        <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  const fullName = `${loanData.firstName} ${loanData.lastName}`;

  const handleUpdateDocument = async (field, file) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append(field, file);

    try {
      const response = await fetch(getApiUrl(`/api/loans/${loanData._id}/documents`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      const resData = await response.json();

      if (response.ok) {
        alert("Document updated successfully!");
        // Update local state with new documents list (without binary data)
        setLoanData({ ...loanData, documents: resData.documents });
      } else {
        alert(`Error: ${resData.error || "Update failed"}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to upload document. Check server.");
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="user-page-container">
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
      <Nav style={{ display: "static" }} />
      <header className="page-header">
        <div className="header-title-section">
          <button onClick={() => navigate('/')} className="btn-icon">
            <ArrowLeft size={20} />
          </button>
          <h1 className="header-title">{fullName} (Sample)</h1>
          <span className="badge-status">{loanData.citizenshipStatus}</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/EditUserPage', { state: { loanData } })}><Edit size={14} /> Edit</button>
          <button className="btn-secondary"><Link2 size={14} /></button>
          <button className="btn-primary">New Transaction <ChevronDown size={14} /></button>
          <button className="btn-secondary">More <ChevronDown size={14} /></button>
          <button onClick={() => navigate('/')} className="close-btn"><X size={20} /></button>
        </div>
      </header>

      <nav className="tabs-nav">
        {['Summary', 'Overview', 'Comments', 'Transactions', 'Mails & Messages', 'Uploads', 'Statement'].map(tab => (
          <div
            key={tab}
            className={`tab-link ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setIsAddingAccount(false);
            }}
          >
            {tab}
          </div>
        ))}

        <div
          className={`tab-link ${['Checking Account', 'Saving Account', 'Credit Card'].includes(activeTab) ? 'active' : ''}`}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onMouseEnter={() => setShowBankingDropdown(true)}
          onMouseLeave={() => setShowBankingDropdown(false)}
        >
          <span>Banking</span> <ChevronDown size={14} style={{ marginLeft: 4 }} />

          {showBankingDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '6px',
              padding: '8px 0',
              zIndex: 100,
              minWidth: '160px',
              border: '1px solid #eee'
            }}>
              {['Checking Account', 'Saving Account', 'Credit Card'].map(acc => (
                <div
                  key={acc}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(acc);
                    setShowBankingDropdown(false);
                    setIsAddingAccount(false);
                    clearForm();
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    color: activeTab === acc ? '#007bff' : '#333',
                    backgroundColor: activeTab === acc ? '#f8f9fa' : 'transparent',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = activeTab === acc ? '#f8f9fa' : 'transparent'}
                >
                  {acc}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {activeTab === 'Overview' && <OverviewView loanData={loanData} fullName={fullName} />}
      {activeTab === 'Summary' && (
        <div style={{ padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
          <OverviewWidgets loanData={loanData} />
        </div>
      )}
      {activeTab === 'Uploads' && (
        <UploadsView
          loanData={loanData}
          handleUpdateDocument={handleUpdateDocument}
          isUploading={isUploading}
        />
      )}
      {activeTab === 'Transactions' && (
        <TransactionsView
          loanData={loanData}
          setupDetails={setupDetails}
          availableStates={availableStates}
          isEditingSetup={isEditingSetup}
          setIsEditingSetup={setIsEditingSetup}
          handleSetupChange={handleSetupChange}
          handleSaveSetup={handleSaveSetup}
        />
      )}
      {activeTab === 'Comments' && (
        <CommentsView loanData={loanData} />
      )}
      {activeTab === 'Mails & Messages' && (
        <MailsMessagesView loanData={loanData} setLoanData={setLoanData} />
      )}
      {['Checking Account', 'Saving Account', 'Credit Card'].includes(activeTab) && (
        <BankingView
          loanData={loanData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAddingAccount={isAddingAccount}
          setIsAddingAccount={setIsAddingAccount}
          nameOnAccount={nameOnAccount}
          setNameOnAccount={setNameOnAccount}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          routingNumber={routingNumber}
          handleRoutingNumberChange={handleRoutingNumberChange}
          bankName={bankName}
          setBankName={setBankName}
          address={address}
          setAddress={setAddress}
          zipCode={zipCode}
          handleZipChange={handleZipChange}
          city={city}
          setCity={setCity}
          stateName={stateName}
          setStateName={setStateName}
          country={country}
          setCountry={setCountry}
          clearForm={clearForm}
          handleBankingSubmit={handleBankingSubmit}
          handleMakeDefault={handleMakeDefault}
          handleDeleteAccount={handleDeleteAccount}
          handleEditAccountClick={handleEditAccountClick}
        />
      )}
      {activeTab !== 'Overview' && activeTab !== 'Summary' && activeTab !== 'Comments' && activeTab !== 'Mails & Messages' && activeTab !== 'Uploads' && activeTab !== 'Transactions' && !['Checking Account', 'Saving Account', 'Credit Card'].includes(activeTab) && (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
          <h3>{activeTab} Content Coming Soon</h3>
          <p>This feature is currently under development.</p>
        </div>
      )}
    </div>
  );
}

export default ParticularLoanPage;