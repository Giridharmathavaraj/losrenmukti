import React, { useState, useEffect } from 'react';
import './CompanyDashboard.css';
import { getApiUrl } from '../apiConfig';
// useNavigate removed as unused
import Nav from './Nav';

function CompanyDashboard() {
    const [loanData, setLoanData] = useState([]);
    // loading state removed as unused

    // Aggregated state
    const [metrics, setMetrics] = useState({
        totalGiven: 0,
        principalReceived: 0,
        outstanding: 0,
        interestIncome: 0,
        totalPaid: 0
    });

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch(getApiUrl('/api/loans'), {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setLoanData(data);

                    let totalGiven = 0;
                    let outstanding = 0;
                    let principalReceived = 0;
                    let interestIncome = 0;

                    data.forEach(loan => {
                        const amount = parseFloat(loan.Request_Loan_Amount) || 0;
                        totalGiven += amount;

                        const pReceived = parseFloat(loan.principalPaid) || 0;
                        const iReceived = parseFloat(loan.interestPaid) || 0;

                        principalReceived += pReceived;
                        interestIncome += iReceived;

                        outstanding += (amount - pReceived);
                    });

                    setMetrics({
                        totalGiven,
                        principalReceived,
                        outstanding,
                        interestIncome,
                        totalPaid: principalReceived + interestIncome
                    });

                }
            } catch (error) {
                console.error("Error fetching loans:", error);
            }
        };
        fetchLoans();
    }, []);

    const hasData = metrics.totalGiven > 0;

    const utilizationPercent = hasData ? Math.round((metrics.outstanding / metrics.totalGiven) * 100) : 0;
    const conicGradient = `conic-gradient(#0d6efd 0% ${utilizationPercent}%, #28a745 ${utilizationPercent}% 100%)`;

    // Mock data for table
    const repaymentSchedule = loanData.slice(0, 4).map((loan, idx) => ({
        ...loan,
        dueDate: ['May 15, 2026', 'Jun 10, 2026', 'Jul 5, 2026', 'Aug 12, 2026'][idx % 4],
        loanType: ['Equipment Loan', 'Working Capital Loan', 'Commercial Mortgage', 'Expansion Loan'][idx % 4]
    }));

    return (
        <div className="dashboard-wrapper company-wrapper">
            <Nav />
            <main className="container company-dashboard-main">

                {/* TOP METRICS ROW */}
                <div className="cd-top-row">
                    {/* Card 1 */}
                    <div className="cd-metric-card">
                        <div className="cd-metric-title">Total Loans</div>
                        <div className="cd-metric-value">${metrics.totalGiven.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <div className="cd-metric-subtitle">{loanData.length} Active Loans</div>
                    </div>

                    {/* Card 2 */}
                    <div className="cd-metric-card">
                        <div className="cd-metric-title">Outstanding Balance</div>
                        <div className="cd-metric-value">${metrics.outstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        <div className="cd-metric-subtitle">Due This Month: <span className="blue-text">${metrics.interestIncome.toLocaleString()}</span></div>
                    </div>

                    {/* Card 3 (Pie Chart) */}
                    <div className="cd-metric-card pie-card-container">
                        <div className="cd-metric-title">Credit Utilization</div>
                        <div className="cd-pie-wrapper">
                            <div className="cd-pie-chart" style={{ background: hasData ? conicGradient : '#eaeaea' }}>
                                <div className="cd-pie-inner">
                                    <div className="cd-pie-percent">{utilizationPercent}%</div>
                                    <div className="cd-pie-sub">Utilized of ${metrics.totalGiven.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE ROW */}
                <div className="cd-middle-row">
                    {/* Loan Overview Chart Box */}
                    <div className="cd-box cd-chart-box">
                        <div className="cd-box-title">Loan Overview</div>
                        <div className="cd-fake-chart-area">
                            {/* Abstract bars to simulate chart */}
                            <div className="fake-bar" style={{ height: '40%' }}></div>
                            <div className="fake-bar" style={{ height: '70%' }}></div>
                            <div className="fake-bar" style={{ height: '90%' }}></div>
                            <div className="fake-bar" style={{ height: '80%' }}></div>
                            <div className="fake-bar" style={{ height: '60%' }}></div>
                        </div>
                        <div className="cd-chart-legend">
                            <span><span className="dot blue-dot"></span> Disbursed: <span className="blue-text">$5.8M</span></span>
                            <span><span className="dot green-dot"></span> Repaid: <span className="green-text">$3.4M</span></span>
                            <span><span className="dot light-blue-dot"></span> Pending: <span className="light-blue-text">$2.45M</span></span>
                        </div>
                    </div>

                    {/* Repayment Schedule Table */}
                    <div className="cd-box cd-table-box">
                        <div className="cd-box-title">Repayment Schedule</div>
                        <table className="cd-table">
                            <thead>
                                <tr>
                                    <th>Due Date</th>
                                    <th>Loan</th>
                                    <th>Amount</th>
                                    <th className="cd-view-all">View All</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repaymentSchedule.map((loan, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{loan.dueDate}</td>
                                        <td>{loan.loanType}</td>
                                        <td style={{ fontWeight: 600 }}>${(parseFloat(loan.Request_Loan_Amount) || 0).toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                ))}
                                {repaymentSchedule.length === 0 && (
                                    <tr><td colSpan="4" className="empty-state">No loans scheduled.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="cd-bottom-row">
                    {/* Active Loans Summary */}
                    <div className="cd-box cd-summary-box">
                        <div className="cd-box-title">Active Loans Summary</div>
                        <div className="cd-pills">
                            <div className="cd-pill active-pill">Term Loans: <strong>6</strong></div>
                            <div className="cd-pill">Equipment Loans: <strong className="blue-text">4</strong></div>
                            <div className="cd-pill">Working Capital Loans: <strong className="blue-text">3</strong></div>
                            <div className="cd-pill">Mortgage Loans: <strong className="blue-text">2</strong></div>
                        </div>
                    </div>

                    {/* Financial Health */}
                    <div className="cd-box cd-health-box">
                        <div className="cd-box-title">Financial Health</div>
                        <div className="cd-health-flex">
                            <div className="cd-health-half">
                                <div className="cd-health-subtitle">Revenue Growth</div>
                                <div className="cd-fake-mini-chart">
                                    <div className="f-bar f1"></div>
                                    <div className="f-bar f2"></div>
                                    <div className="f-bar f3"></div>
                                    <div className="f-bar f4"></div>
                                    <div className="f-bar f5"></div>
                                    <div className="f-bar f6"></div>
                                </div>
                                <div className="cd-health-labels">
                                    <span>This Quarter</span>
                                    <span>Previous Quarter</span>
                                </div>
                            </div>
                            <div className="cd-health-half">
                                <div className="cd-health-subtitle">Debt-to-Equity Ratio</div>
                                <div className="cd-gauge-container">
                                    <div className="cd-gauge-arch"></div>
                                    <div className="cd-gauge-value">1.8</div>
                                    <div className="cd-gauge-status">Moderate</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default CompanyDashboard;
