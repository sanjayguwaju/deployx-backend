import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { sendSuccess, sendError } from "../../utils/response";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";
import { AppDocument } from "../../models/Document";
import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export async function generateSifaris(req: AuthRequest, res: Response) {
  try {
    const { templateName, data } = req.body;
    
    // Ensure we have a tenant context
    if (!req.user || !req.user.tenantId) {
      return sendError(res, 401, "Unauthorized");
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return sendError(res, 404, "Tenant not found");
    }

    const user = await User.findById(req.user.id).populate("officeId");

    const templatePath = path.join(__dirname, "templates", `${templateName || "default"}.ejs`);
    
    if (!fs.existsSync(templatePath)) {
      return sendError(res, 404, "Template not found");
    }

    // Generate unique hash for verification
    const verificationHash = uuidv4();

    // Determine the verification URL (can fall back to localhost in dev)
    const frontendUrl = process.env.FRONTEND_URL || (req.headers.origin ? req.headers.origin : `http://${req.get("host")?.replace("5000", "5173")}`);
    const verifyUrl = `${frontendUrl}/verify/${verificationHash}`;

    // Generate QR Code as base64 data URI
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 150,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });

    // Save document to DB for future verification
    const newDoc = new AppDocument({
      documentType: "sifaris",
      templateName: templateName || "default",
      data: data || {},
      issuedBy: user?._id,
      tenantId: tenant._id,
      verificationHash,
      qrCodeUrl: verifyUrl,
    });
    await newDoc.save();

    const templateData = {
      tenantName: tenant.name,
      tenantNameNp: tenant.nameNp || tenant.name,
      office: user?.officeId ? (user.officeId as any).officeNumber : "कार्यालय", // or Office
      date: new Date().toLocaleDateString(), // To be replaced with BS
      data: data || {},
      qrCode: qrCodeDataUrl, // Inject QR code into template
      verificationHash,
      ...data,
    };

    const html = await ejs.renderFile(templatePath, templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html as string, { waitUntil: "load" });

    // Generate PDF in a temporary folder or directly to buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });

    await browser.close();

    // Set headers to trigger a download or display inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="sifaris-${verificationHash}.pdf"`);
    
    return res.end(pdfBuffer);
  } catch (error: any) {
    console.error("Sifaris generation error:", error);
    return sendError(res, 500, "Error generating Sifaris");
  }
}

export async function verifyDocument(req: Request, res: Response) {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return sendError(res, 400, "Verification hash is required");
    }

    const doc = await AppDocument.findOne({ verificationHash: hash })
      .populate("issuedBy", "name email")
      .populate("tenantId", "name nameNp");

    if (!doc) {
      return sendError(res, 404, "Document not found or invalid QR code");
    }

    if (doc.status === "revoked") {
      return sendError(res, 403, "This document has been revoked by the tenant");
    }

    return sendSuccess(res, {
      documentType: doc.documentType,
      templateName: doc.templateName,
      issueDate: doc.issueDate,
      issuedBy: doc.issuedBy,
      tenant: doc.tenantId,
    }, "Document verified successfully");
  } catch (error: any) {
    console.error("Document verification error:", error);
    return sendError(res, 500, "Error verifying document");
  }
}
