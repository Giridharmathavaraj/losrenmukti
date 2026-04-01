import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import cors from 'cors';
import catalyst from 'zcatalyst-sdk-node';
import fs from 'fs';
import https from 'https';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Loan from './src/models/Loan.js';
import User from './src/models/User.js';
import Company from './src/models/Company.js';
import State from './src/models/State.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here'; // In production, use environment variables!

let emailTransporter;

// Gmail SMTP Configuration
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("✅ Gmail SMTP Transporter Initialized");
} else {
  // Fallback to Ethereal for development if no credentials provided
  nodemailer.createTestAccount().then(account => {
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    console.log("⚠️ Using Ethereal Test Account (Real emails will NOT be sent)");
  }).catch(err => console.error("Ethereal test account error:", err));
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFields = upload.fields([
  { name: 'driversLicense', maxCount: 1 },
  { name: 'payStub1', maxCount: 1 },
  { name: 'payStub2', maxCount: 1 },
  { name: 'bankStatement1', maxCount: 1 },
  { name: 'bankStatement2', maxCount: 1 },
]);

const app = express();

// --- Catalyst Connection (Tutorial Method) ---
app.use((req, res, next) => {
  try {
    // Initialize Catalyst SDK for the current request context
    req.catalyst = catalyst.initialize(req);
    next();
  } catch (error) {
    // Gracefully handle local development where SDK might not be initialized
    if (process.env.NODE_ENV !== 'production') {
      // console.log("Local Dev: Catalyst SDK not initialized");
    }
    next();
  }
});
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Basic Pre-fixing logic for production builds, optional on localhost
  const apiPrefixes = ['/loans', '/users', '/companies', '/states', '/login', '/register', '/health', '/api'];
  const needsPrefix = apiPrefixes.some(p => req.url.startsWith(p));

  if (needsPrefix && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
    console.log(`[Harden] Re-prefixed URL: ${req.url}`);
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

// Connect to MongoDB
const DEFAULT_ATLAS_URI = 'mongodb+srv://giridharmathavaraj_db_user:JlqWzElUK6bDDVUt@cluster0.kjqzoqe.mongodb.net/loanpro_db?retryWrites=true&w=majority';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;

let isDbConnected = false;

mongoose.connect(MONGODB_URI)
  .then(() => {
    isDbConnected = true;
    const isAtlas = MONGODB_URI.includes('mongodb+srv');
    const dbName = mongoose.connection.name;
    console.log(`✅ MongoDB Connected to ${isAtlas ? 'Atlas' : 'Local'} (${dbName})`);
  })
  .catch(err => {
    isDbConnected = false;
    console.error('❌ MongoDB Connection Error:', err.message);
    // DO NOT call process.exit(1) in a Catalyst Function as it crashes the service
  });

// --- MongoDB Connection Guard ---
app.use((req, res, next) => {
  // Allow health checks even if DB is down
  if (req.path === '/api/health') return next();

  if (!isDbConnected && req.path.startsWith('/api')) {
    return res.status(503).json({
      error: 'Database connection not ready. Check your MongoDB Atlas IP Whitelist (Allow Access from Anywhere 0.0.0.0/0 recommended for initial Catalyst testing).'
    });
  }
  next();
});

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// --- Company Routes ---

// Create a new company
app.post('/api/companies', authenticateToken, async (req, res) => {
  // Only superadmin should ideally create companies, but we'll leave it open or check here
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only Superadmins can create companies.' });
  }

  try {
    const { name, contactEmail, status } = req.body;

    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }

    const newCompany = new Company({ name, contactEmail, status });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all companies
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    // RBAC Logic: Superadmin sees all. Admins/Users see only their own company.
    if (req.user.role === 'superadmin') {
      const companies = await Company.find().sort({ createdAt: -1 });
      return res.json(companies);
    } else {
      // For Admin/User, just return their single company in an array so the frontend map works
      if (!req.user.companyId) return res.json([]);
      const company = await Company.findById(req.user.companyId);
      return res.json(company ? [company] : []);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a company
app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const isMainAdmin = req.user.username === 'owner';
    // Admins can ONLY edit THEIR own company.
    if (!isMainAdmin && req.user.companyId !== req.params.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this company.' });
    }

    const { id } = req.params;
    const { name, contactEmail, status } = req.body;
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { name, contactEmail, status },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(updatedCompany);
  } catch (error) {
    console.error("Update Company Error:", error); res.status(400).json({ message: error.message });
  }
});

// --- State Routes ---

app.get('/api/states', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.companyId && req.user.role !== 'superadmin') {
      query.companyId = req.user.companyId;
    }
    const states = await State.find(query).sort({ name: 1 });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/states', authenticateToken, async (req, res) => {
  try {
    const { name, code, interestRate, originationFees, status, minLoanAmount, maxLoanAmount } = req.body;
    let companyId = req.user.companyId || null;

    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

    const existingState = await State.findOne({ name: name.trim(), companyId: companyId });
    if (existingState) return res.status(400).json({ error: 'State with this name already exists' });

    const newState = new State({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      interestRate: Number(interestRate) || 0,
      originationFees: Number(originationFees) || 0,
      minLoanAmount: Number(minLoanAmount) || 0,
      maxLoanAmount: Number(maxLoanAmount) || 0,
      status: status === 'Approved' ? 'Approved' : 'Pending',
      companyId
    });
    await newState.save();
    res.status(201).json(newState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/states/import', authenticateToken, async (req, res) => {
  try {
    const { states } = req.body; // Array of objects {name, code}
    const companyId = req.user.companyId || null;

    if (!Array.isArray(states)) return res.status(400).json({ error: 'Expected an array of states' });

    const addedStates = [];
    const errors = [];

    for (const s of states) {
      if (!s.name || !s.code) continue;
      try {
        const existing = await State.findOne({
          $or: [{ name: s.name.trim() }, { code: s.code.trim().toUpperCase() }],
          companyId
        });

        if (!existing) {
          const newState = new State({
            name: s.name.trim(),
            code: s.code.trim().toUpperCase(),
            interestRate: Number(s.interestRate) || 0,
            originationFees: Number(s.originationFees) || 0,
            minLoanAmount: Number(s.minLoanAmount) || 0,
            maxLoanAmount: Number(s.maxLoanAmount) || 0,
            status: s.status === 'Approved' ? 'Approved' : 'Pending',
            companyId
          });
          await newState.save();
          addedStates.push(newState);
        }
      } catch (err) {
        errors.push(`Failed to import ${s.name}: ${err.message}`);
      }
    }

    res.status(200).json({ importedCount: addedStates.length, addedStates, errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/states/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, interestRate, originationFees, minLoanAmount, maxLoanAmount, status } = req.body;
    let query = { _id: id };
    if (req.user.companyId && req.user.role !== 'superadmin') {
      query.companyId = req.user.companyId;
    }

    const updatedState = await State.findOneAndUpdate(query, {
      name,
      code: code?.toUpperCase(),
      interestRate,
      originationFees,
      minLoanAmount,
      maxLoanAmount,
      status
    }, { new: true });

    if (!updatedState) return res.status(404).json({ error: 'State not found or unauthorized' });
    res.json(updatedState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/states/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let query = { _id: id };
    if (req.user.companyId && req.user.role !== 'superadmin') {
      query.companyId = req.user.companyId;
    }

    const deletedState = await State.findOneAndDelete(query);
    if (!deletedState) return res.status(404).json({ error: 'State not found or unauthorized' });

    res.json({ message: 'State deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/states/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let query = { _id: id };
    if (req.user.companyId && req.user.role !== 'superadmin') {
      query.companyId = req.user.companyId;
    }

    if (!['Pending', 'Approved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedState = await State.findOneAndUpdate(query, { status }, { new: true });
    if (!updatedState) return res.status(404).json({ error: 'State not found or unauthorized' });

    res.json(updatedState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Auth & User Routes ---

app.post('/api/register', authenticateToken, async (req, res) => {
  try {
    let { username, password, role, status, companyId } = req.body;

    // RBAC: If an Admin creates a user, force the companyId to be the Admin's companyId
    if (req.user.role === 'admin') {
      companyId = req.user.companyId;
    } else if (req.user.role === 'users') {
      return res.status(403).json({ error: 'Standard users cannot create other users.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'users',
      status: status || 'enable',
      companyId: companyId || null
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'disable') {
      return res.status(403).json({ error: 'Account disabled. Please contact an administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT token including RBAC data
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Route to get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = {};
    // RBAC logic for users
    if (req.user.role === 'admin') {
      // Admins only see users from their own company
      query.companyId = req.user.companyId;
    } else if (req.user.role === 'users') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const users = await User.find(query).select('-password').populate('companyId', 'name'); // Exclude password and fetch company name
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to update a user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Standard users cannot edit users
    if (req.user.role === 'users') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { id } = req.params;
    let { role, status, companyId } = req.body;

    // Admins cannot change a user's company
    if (req.user.role === 'admin') {
      // Ignore the requested companyId and keep it scoped
      companyId = req.user.companyId;
    }

    // Convert empty string to null for companyId to remove company, or leave it as is if provided
    const updateData = { role, status };
    if (companyId !== undefined) {
      updateData.companyId = companyId === '' ? null : companyId;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .select('-password')
      .populate('companyId', 'name');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error); res.status(400).json({ message: error.message });
  }
});

// Route to handle the full form submission
app.post('/api/loans', authenticateToken, uploadFields, async (req, res) => {
  try {
    console.log('Received raw body:', req.body);
    console.log('Received files:', req.files ? Object.keys(req.files) : 'none');

    const loanData = { ...req.body };

    // Automatically assign the loan to the user's company
    if (req.user.companyId) {
      loanData.companyId = req.user.companyId;
    }

    // Multer (multipart/form-data) sends everything as strings. 
    // We need to parse fields that the Mongoose schema expects as Numbers or Booleans.
    if (loanData.noOfIndividual) loanData.noOfIndividual = Number(loanData.noOfIndividual);
    if (loanData.Request_Loan_Amount) loanData.Request_Loan_Amount = Number(loanData.Request_Loan_Amount);
    if (loanData.rentAmount) loanData.rentAmount = Number(loanData.rentAmount);

    // Handle booleans
    loanData.checkBox = loanData.checkBox === 'true';
    loanData.potentialBorrower = loanData.potentialBorrower === 'true';

    // Handle nested files
    loanData.documents = {};
    if (req.files) {
      const fileMap = {
        driversLicense: 'driversLicense',
        payStub1: 'payStub1',
        payStub2: 'payStub2',
        bankStatement1: 'bankStatement1',
        bankStatement2: 'bankStatement2'
      };

      for (const [key, fieldName] of Object.entries(fileMap)) {
        if (req.files[fieldName]) {
          loanData.documents[key] = {
            data: req.files[fieldName][0].buffer,
            contentType: req.files[fieldName][0].mimetype
          };
        }
      }
    }

    const newLoan = new Loan(loanData);
    const savedLoan = await newLoan.save();
    console.log('Loan saved successfully:', savedLoan._id);

    // Return saved data without binary buffers to keep response size small
    const responseData = savedLoan.toObject();
    if (responseData.documents) {
      Object.keys(responseData.documents).forEach(k => {
        if (responseData.documents[k]) responseData.documents[k].data = undefined;
      });
    }

    res.status(201).json({
      message: "Full application (including documents) saved!",
      data: responseData
    });
  } catch (error) {
    console.error('Error saving loan:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route to get all loans
app.get('/api/loans', authenticateToken, async (req, res) => {
  try {


    let query = {};
    // Only 'owner' username gets full superadmin access to all companies
    const isMainAdmin = req.user.username === 'owner';

    if (!isMainAdmin && req.user.companyId) {
      query.companyId = req.user.companyId;
    } else if (!isMainAdmin && !req.user.companyId) {
      // Non-main admin without company sees nothing
      return res.json([]);
    }

    const loans = await Loan.find(query).populate({ path: 'companyId', select: 'name', model: Company });
    res.json(loans);
  } catch (error) {
    fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Error: ${error.message}\n${error.stack}\n`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loans/:id', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to update a loan
app.put('/api/loans/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Auto-generate audit comment
    const updateComment = {
      updatedBy: req.user.username || 'System',
      updatedAt: new Date(),
      message: 'Loan details and configuration updated'
    };

    const updatedData = { ...req.body };
    delete updatedData.comments; // Prevent overriding array from frontend direct puts

    // Grab the original before update for comparison
    const originalLoan = await Loan.findById(id);

    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      {
        ...updatedData,
        $push: { comments: updateComment }
      },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    let mailSent = false;
    // CHECK IF WE NEED TO SEND AUTOMATED EMAILS
    if (updatedLoan && originalLoan) {
      if (req.body.transactions || req.body.completedPayments) {
        if (emailTransporter && updatedLoan.email) {
          mailSent = true;
          const subject = "Alert: Your Loan Payment Date was Updated";
          const text = `Dear ${updatedLoan.firstName},\n\nA payment date on your transaction schedule was recently modified.\nPlease log in to your portal to review the updated schedule.\n\nThank you,\nLOS Team`;
          emailTransporter.sendMail({
            from: `"LOS Updates" <${process.env.EMAIL_USER || 'giridharmathavaraj@gmail.com'}>`,
            to: updatedLoan.email,
            subject, text
          }).then(async i => {
            console.log('Payment Email Sent: ' + (i.messageId || 'Success'));
            await Loan.findByIdAndUpdate(id, { $push: { emails: { sentBy: 'System', sentAt: new Date(), subject, message: text, recipient: updatedLoan.email } } });
          }).catch(console.error);
        }
      }
      if (req.body.bankingDetails) {
        if (emailTransporter && updatedLoan.email) {
          mailSent = true;
          const subject = "Alert: Your Bank Details were Updated";
          const text = `Dear ${updatedLoan.firstName},\n\nThe banking details for ${req.body.bankingDetails.accountType || 'your account'} were successfully updated.\n\nThank you,\nLOS Security`;
          emailTransporter.sendMail({
            from: `"LOS Security" <${process.env.EMAIL_USER || 'giridharmathavaraj@gmail.com'}>`,
            to: updatedLoan.email,
            subject, text
          }).then(async i => {
            console.log('Banking Email Sent: ' + (i.messageId || 'Success'));
            await Loan.findByIdAndUpdate(id, { $push: { emails: { sentBy: 'System', sentAt: new Date(), subject, message: text, recipient: updatedLoan.email } } });
          }).catch(console.error);
        }
      }
    }

    res.json({ ...updatedLoan.toObject(), mailSent });
  } catch (error) {
    console.error("Update Loan Error:", error); res.status(400).json({ message: error.message });
  }
});

// Route to update documents specifically
app.patch('/api/loans/:id/documents', authenticateToken, uploadFields, async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (!loan.documents) loan.documents = {};

    if (req.files) {
      const fileMap = {
        driversLicense: 'driversLicense',
        payStub1: 'payStub1',
        payStub2: 'payStub2',
        bankStatement1: 'bankStatement1',
        bankStatement2: 'bankStatement2'
      };

      for (const [key, fieldName] of Object.entries(fileMap)) {
        if (req.files[fieldName]) {
          loan.documents[key] = {
            data: req.files[fieldName][0].buffer,
            contentType: req.files[fieldName][0].mimetype
          };
        }
      }

      if (!loan.comments) loan.comments = [];
      loan.comments.push({
        updatedBy: req.user.username || 'System',
        updatedAt: new Date(),
        message: 'Loan documents uploaded/updated'
      });

      await loan.save();
    }

    // Return status without binary data
    const updatedLoan = loan.toObject();
    if (updatedLoan.documents) {
      Object.keys(updatedLoan.documents).forEach(k => {
        if (updatedLoan.documents[k]) updatedLoan.documents[k].data = undefined;
      });
    }

    res.json({
      message: "Documents updated successfully!",
      documents: updatedLoan.documents
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    res.status(400).json({ error: error.message });
  }
});

// Custom Custom Email Route
app.post('/api/loans/:id/send-email', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message, recipient } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (emailTransporter) {
      const info = await emailTransporter.sendMail({
        from: `"LOS Team" <${process.env.EMAIL_USER || 'giridharmathavaraj@gmail.com'}>`,
        to: recipient || loan.email,
        subject: subject,
        text: message
      });
      console.log('Custom Email Sent: ' + (info.messageId || 'Success'));

      const newEmailLog = {
        sentBy: req.user.username || 'System',
        sentAt: new Date(),
        subject,
        message,
        recipient: recipient || loan.email
      };

      const updatedLoan = await Loan.findByIdAndUpdate(id, { $push: { emails: newEmailLog } }, { new: true });
      res.json(updatedLoan);
    } else {
      res.status(500).json({ message: "Email transporter not configured" });
    }
  } catch (error) {
    console.error("Send Email Route Error:", error); res.status(400).json({ message: error.message });
  }
});
// --- Static Assets (Production) ---
// Serve the built frontend files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Catch-all: If it's not an API call, serve the index.html
// SPA Catch-all: If it's not an API call, serve the index.html
app.use((req, res, next) => {
  // If request matches /api, return 404 JSON (catches invalid API routes)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Otherwise, serve index.html for frontend routing
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  try {
    const options = {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-cert.pem'))
    };
    https.createServer(options, app).listen(PORT, () => {
      console.log(`🚀 HTTPS Server running locally on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start HTTPS Server:', err.message);
    app.listen(PORT, () => console.log(`🚀 HTTP Server running locally on port ${PORT}`));
  }
}

export default app;
