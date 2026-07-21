import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import logger from "../config/logger";

/**
 * Generates a PDF buffer from an EJS template and data.
 * @param templateName Name of the ejs file (without .ejs extension)
 * @param data Data payload to inject into the template
 * @returns Buffer containing the PDF data
 */
export async function generatePdf(templateName: string, data: any): Promise<Buffer> {
  let browser;
  try {
    const templatePath = path.join(__dirname, "..", "templates", "pdf", `${templateName}.ejs`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`PDF Template not found: ${templatePath}`);
    }

    const htmlContent = (await ejs.renderFile(templatePath, data)) as string;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    
    // Set content and wait for network to be idle so external fonts/images load
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    
    // Convert to PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px"
      }
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.error(`Error generating PDF for template ${templateName}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
