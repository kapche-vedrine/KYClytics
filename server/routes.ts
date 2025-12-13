import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, generateToken, hashPassword, comparePassword } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { calculateRisk, DEFAULT_RISK_CONFIG } from "../client/src/lib/risk-engine";

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientId = req.params.id;
    const dir = path.join(process.cwd(), "server/uploads", clientId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Client Routes
  app.get("/api/clients", authMiddleware, async (req, res) => {
    try {
      const { riskBand, search } = req.query;
      const clients = await storage.getClients({
        riskBand: riskBand as string,
        search: search as string
      });
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/clients/:id", authMiddleware, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/clients", authMiddleware, async (req, res) => {
    try {
      const clientData = req.body;
      
      // Calculate risk
      const config = await storage.getRiskConfig();
      const riskCalc = calculateRisk(clientData, config as any || DEFAULT_RISK_CONFIG);
      
      const nextReview = new Date();
      nextReview.setMonth(nextReview.getMonth() + riskCalc.nextReviewMonths);
      
      const client = await storage.createClient({
        ...clientData,
        score: riskCalc.score,
        band: riskCalc.band,
        status: "OK",
        nextReview
      } as any);
      
      res.status(201).json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/clients/:id", authMiddleware, async (req, res) => {
    try {
      const clientData = req.body;
      
      // Recalculate risk if relevant fields changed
      const config = await storage.getRiskConfig();
      const riskCalc = calculateRisk(clientData, config as any || DEFAULT_RISK_CONFIG);
      
      const nextReview = new Date();
      nextReview.setMonth(nextReview.getMonth() + riskCalc.nextReviewMonths);
      
      const client = await storage.updateClient(req.params.id, {
        ...clientData,
        score: riskCalc.score,
        band: riskCalc.band,
        nextReview
      } as any);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/clients/:id", authMiddleware, async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Document Routes
  app.post("/api/clients/:id/documents", authMiddleware, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      
      const document = await storage.createDocument({
        clientId: req.params.id,
        name: req.file.originalname,
        size: `${fileSizeMB} MB`,
        type: req.file.mimetype,
        path: req.file.path
      });
      
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/clients/:id/documents/:docId/download", authMiddleware, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.docId);
      
      if (!document || document.clientId !== req.params.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (!fs.existsSync(document.path)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      res.download(document.path, document.name);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/clients/:id/documents/:docId", authMiddleware, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.docId);
      
      if (!document || document.clientId !== req.params.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Delete file from disk
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }
      
      await storage.deleteDocument(req.params.docId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // PDF Report Generation
  app.get("/api/clients/:id/report", authMiddleware, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const documents = await storage.getClientDocuments(req.params.id);
      
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=KYC_Report_${client.id}.pdf`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(24).text('KYC Risk Assessment Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);
      
      // Client Information
      doc.fontSize(16).text('Client Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Name: ${client.firstName} ${client.lastName}`);
      doc.text(`Date of Birth: ${client.dob}`);
      doc.text(`Address: ${client.address}`);
      doc.text(`Country: ${client.country}`);
      doc.text(`Postal Code: ${client.postalCode}`);
      doc.text(`Occupation: ${client.job}`);
      doc.text(`Industry: ${client.industry}`);
      doc.text(`PEP Status: ${client.pep ? 'Yes' : 'No'}`);
      doc.moveDown(2);
      
      // Risk Assessment
      doc.fontSize(16).text('Risk Assessment', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Risk Score: ${client.score}`);
      doc.text(`Risk Band: ${client.band}`);
      doc.text(`Review Status: ${client.status}`);
      doc.text(`Next Review Date: ${new Date(client.nextReview).toLocaleDateString()}`);
      doc.text(`Last Updated: ${new Date(client.lastUpdated).toLocaleDateString()}`);
      doc.moveDown(2);
      
      // Documents
      doc.fontSize(16).text('Attached Documents', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      if (documents.length === 0) {
        doc.text('No documents attached.');
      } else {
        documents.forEach((d, i) => {
          doc.text(`${i + 1}. ${d.name} (${d.size}) - Uploaded: ${new Date(d.uploadDate).toLocaleDateString()}`);
        });
      }
      
      doc.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Risk Config Routes
  app.get("/api/risk-config", authMiddleware, async (req, res) => {
    try {
      const config = await storage.getRiskConfig();
      res.json(config || DEFAULT_RISK_CONFIG);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/risk-config", authMiddleware, async (req, res) => {
    try {
      const config = await storage.updateRiskConfig(req.body);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
