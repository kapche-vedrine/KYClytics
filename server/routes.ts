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
  app.get("/api/clients/:id/documents", authMiddleware, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const documents = await storage.getClientDocuments(req.params.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
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
      const config = await storage.getRiskConfig();
      
      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true, bufferPages: true });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=KYC_Report_${client.firstName}_${client.lastName}.pdf`);
      
      doc.pipe(res);
      
      const primaryColor = '#1e40af';
      const dangerColor = '#dc2626';
      const warningColor = '#ca8a04';
      const successColor = '#16a34a';
      const grayColor = '#64748b';
      
      const getRiskColor = (band: string) => {
        if (band === 'RED') return dangerColor;
        if (band === 'YELLOW') return warningColor;
        return successColor;
      };

      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
      
      doc.fontSize(28).fillColor('white').text('KYClytics', 50, 35, { continued: false });
      doc.fontSize(12).fillColor('white').text('Know Your Customer Compliance Platform', 50, 70);
      
      doc.fontSize(10).fillColor('white').text(`Report ID: ${client.id.substring(0, 8).toUpperCase()}`, doc.page.width - 200, 35);
      doc.text(`Generated: ${new Date().toLocaleString()}`, doc.page.width - 200, 50);
      
      doc.fillColor('black');
      doc.moveDown(4);
      
      doc.fontSize(22).fillColor(primaryColor).text('KYC Risk Assessment Report', 50, 140);
      doc.moveTo(50, 170).lineTo(doc.page.width - 50, 170).strokeColor(primaryColor).lineWidth(2).stroke();
      doc.moveDown(2);
      
      const boxY = 190;
      const boxWidth = (doc.page.width - 140) / 3;
      
      doc.rect(50, boxY, boxWidth, 70).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(10).fillColor(grayColor).text('RISK SCORE', 60, boxY + 12, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(28).fillColor(getRiskColor(client.band)).text(String(client.score), 60, boxY + 30, { width: boxWidth - 20, align: 'center' });
      
      doc.rect(50 + boxWidth + 20, boxY, boxWidth, 70).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(10).fillColor(grayColor).text('RISK BAND', 60 + boxWidth + 20, boxY + 12, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(18).fillColor(getRiskColor(client.band)).text(client.band, 60 + boxWidth + 20, boxY + 35, { width: boxWidth - 20, align: 'center' });
      
      doc.rect(50 + (boxWidth + 20) * 2, boxY, boxWidth, 70).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(10).fillColor(grayColor).text('NEXT REVIEW', 60 + (boxWidth + 20) * 2, boxY + 12, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(14).fillColor('#1e293b').text(new Date(client.nextReview).toLocaleDateString(), 60 + (boxWidth + 20) * 2, boxY + 35, { width: boxWidth - 20, align: 'center' });
      
      let currentY = boxY + 100;
      
      doc.rect(50, currentY, doc.page.width - 100, 25).fill(primaryColor);
      doc.fontSize(12).fillColor('white').text('CLIENT INFORMATION', 60, currentY + 7);
      currentY += 35;
      
      doc.fillColor('#1e293b');
      const leftCol = 60;
      const rightCol = 300;
      
      doc.fontSize(10).fillColor(grayColor).text('Full Name', leftCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(`${client.firstName} ${client.lastName}`, leftCol, currentY + 12);
      
      doc.fontSize(10).fillColor(grayColor).text('Date of Birth', rightCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(client.dob, rightCol, currentY + 12);
      
      currentY += 40;
      
      doc.fontSize(10).fillColor(grayColor).text('Address', leftCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(`${client.address}, ${client.postalCode}`, leftCol, currentY + 12);
      
      doc.fontSize(10).fillColor(grayColor).text('Country', rightCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(client.country, rightCol, currentY + 12);
      
      currentY += 40;
      
      doc.fontSize(10).fillColor(grayColor).text('Occupation', leftCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(client.job, leftCol, currentY + 12);
      
      doc.fontSize(10).fillColor(grayColor).text('Industry', rightCol, currentY);
      doc.fontSize(11).fillColor('#1e293b').text(client.industry, rightCol, currentY + 12);
      
      currentY += 40;
      
      doc.fontSize(10).fillColor(grayColor).text('PEP Status', leftCol, currentY);
      if (client.pep) {
        doc.fontSize(11).fillColor(dangerColor).text('Yes - Politically Exposed Person', leftCol, currentY + 12);
      } else {
        doc.fontSize(11).fillColor(successColor).text('No', leftCol, currentY + 12);
      }
      
      doc.fontSize(10).fillColor(grayColor).text('Review Status', rightCol, currentY);
      const statusColor = client.status === 'OVERDUE' ? dangerColor : client.status === 'DUE_SOON' ? warningColor : successColor;
      doc.fontSize(11).fillColor(statusColor).text(client.status.replace('_', ' '), rightCol, currentY + 12);
      
      currentY += 50;
      
      doc.rect(50, currentY, doc.page.width - 100, 25).fill(primaryColor);
      doc.fontSize(12).fillColor('white').text('RISK FACTORS', 60, currentY + 7);
      currentY += 35;
      
      doc.fillColor('#1e293b');
      const riskFactors: string[] = [];
      
      if (client.pep) riskFactors.push('Client is a Politically Exposed Person (PEP)');
      if (config?.highRiskCountries?.includes(client.country)) riskFactors.push(`Country (${client.country}) is on high-risk list`);
      if (config?.highRiskIndustries?.includes(client.industry)) riskFactors.push(`Industry (${client.industry}) is high-risk`);
      if (config?.cashIntensiveJobs?.some((j: string) => client.job.toLowerCase().includes(j.toLowerCase()))) {
        riskFactors.push(`Occupation (${client.job}) is cash-intensive`);
      }
      
      if (riskFactors.length === 0) {
        doc.fontSize(11).fillColor(successColor).text('No significant risk factors identified.', leftCol, currentY);
        currentY += 20;
      } else {
        riskFactors.forEach(factor => {
          doc.fontSize(11).fillColor(dangerColor).text(`• ${factor}`, leftCol, currentY);
          currentY += 18;
        });
      }
      
      currentY += 20;
      
      doc.rect(50, currentY, doc.page.width - 100, 25).fill(primaryColor);
      doc.fontSize(12).fillColor('white').text('ATTACHED DOCUMENTS', 60, currentY + 7);
      currentY += 35;
      
      if (documents.length === 0) {
        doc.fontSize(11).fillColor(grayColor).text('No documents have been attached to this client profile.', leftCol, currentY);
        currentY += 20;
      } else {
        documents.forEach((d, i) => {
          doc.fontSize(11).fillColor('#1e293b').text(`${i + 1}. ${d.name}`, leftCol, currentY);
          doc.fontSize(10).fillColor(grayColor).text(`   Size: ${d.size} | Uploaded: ${new Date(d.uploadDate).toLocaleDateString()}`, leftCol, currentY + 14);
          currentY += 32;
        });
      }
      
      currentY += 30;
      
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      currentY += 15;
      doc.fontSize(8).fillColor(grayColor).text('This report is generated by KYClytics for compliance purposes only.', 50, currentY, { align: 'center', width: doc.page.width - 100 });
      doc.fontSize(8).text(`© ${new Date().getFullYear()} KYClytics. All rights reserved.`, 50, currentY + 12, { align: 'center', width: doc.page.width - 100 });
      
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

  // User Preferences Routes
  app.get("/api/user/preferences", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const prefs = await storage.getUserPreferences(userId);
      
      // Return default preferences if none exist
      if (!prefs) {
        return res.json({
          theme: 'light',
          primaryColor: '#1e40af',
          dashboardWidgets: ['stats', 'riskChart', 'priorityReviews', 'recentActivity'],
          widgetLayout: 'default'
        });
      }
      
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/preferences", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const prefs = await storage.updateUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
