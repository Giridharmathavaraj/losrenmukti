import mongoose from 'mongoose';

const LoanSchema = new mongoose.Schema({
    // Personal Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    social_Security_Code: { type: String, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    generationCode: { type: String },
    citizenshipStatus: { type: String, required: true },

    // Housing
    Primary_Address_Zip_Code: { type: String, required: true },
    Primary_Address: { type: String, required: true },
    Primary_Address_State: { type: String, required: true },
    Primary_Address_Country: { type: String, required: true },
    propertyStatus: { type: String, required: true },
    rentAmount: {
        type: Number,
        required: function () { return this.propertyStatus === 'Rent'; }
    },
    noOfIndividual: { type: Number, required: true },

    // Mailing
    Mailing_Address_Zip_Code: { type: String, required: true },
    Mailing_Address: { type: String, required: true },
    Mailing_Address_State: { type: String, required: true },
    Mailing_Address_Country: { type: String, required: true },

    // Loan & Employment
    Request_Loan_Amount: { type: Number, required: true },
    loanPurpose: { type: String, required: true },
    selfEmployee: { type: String, required: true },
    cCompanyName: { type: String, required: true },
    cZipCode: { type: String, required: true },
    cCity: { type: String, required: true },
    cCountry: { type: String, required: true },
    income: { type: String, required: true },
    hireDate: { type: Date, required: true },

    // Co-Borrower (Optional)
    coFirstName: { type: String, default: "" },
    coLastName: { type: String, default: "" },
    coGenerationCode: { type: String, default: "None" },
    coEmail: { type: String, default: "" },
    coPhone: { type: String, default: "" },
    coGender: { type: String, default: "Female" },
    coDateOfBirth: { type: String, default: "" }, 

    // Co-Borrower Address Information
    coPrimary_Address_Zip_Code: { type: String, default: "" },
    coPrimary_Address: { type: String, default: "" },
    coPrimary_Address_State: { type: String, default: "" },
    coPrimary_Address_Country: { type: String, default: "" },

    coMailing_Address_Zip_Code: { type: String, default: "" },
    coMailing_Address: { type: String, default: "" },
    coMailing_Address_State: { type: String, default: "" },
    coMailing_Address_Country: { type: String, default: "" },

    // Compliance
    checkBox: { type: Boolean, required: true },
    smsStatus: { type: String, required: true },
    potentialBorrower: { type: Boolean, required: true },

    // Loan Setup Details (Transactions page editable fields)
    interestRate: { type: Number, default: 12 },
    interestRateType: { type: String, default: 'Annually' },
    tierInterestRate: { type: Boolean, default: false },
    contractDate: { type: Date, default: null },
    firstPaymentDate: { type: Date, default: null },
    discount: { type: Number, default: 0 },
    underwritingRefinanceFee: { type: Number, default: 0 },
    paymentFrequency: { type: String, default: 'Monthly' },

    completedPayments: {
        type: Map,
        of: String,
        default: {}
    },

    transactions: [{
        period: Number,
        date: String,
        Status: String,
        completedDate: String,
        payment: Number
    }],

    comments: [{
        updatedBy: String,
        updatedAt: { type: Date, default: Date.now },
        message: String
    }],

    emails: [{
        sentBy: String,
        sentAt: { type: Date, default: Date.now },
        subject: String,
        message: String,
        recipient: String
    }],

    bankingDetails: [{
        accountType: String,
        nameOnAccount: String,
        accountNumber: String,
        routingNumber: String,
        bankName: String,
        address: String,
        zipCode: String,
        city: String,
        stateName: String,
        country: String,
        isDefault: { type: Boolean, default: false }
    }],

    documents: {
        driversLicense: { data: Buffer, contentType: String },
        payStub1: { data: Buffer, contentType: String },
        payStub2: { data: Buffer, contentType: String },
        bankStatement1: { data: Buffer, contentType: String },
        bankStatement2: { data: Buffer, contentType: String }
    },
    submittedAt: { type: Date, default: Date.now },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
});

const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

export default Loan;
