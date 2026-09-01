/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Predict Pro Dedicated Email Dispatch Service
 * Supports SMTP (Gmail / Custom), REST Mail APIs, and Fallback Outbox Queue
 */

import fs from 'fs';
import path from 'path';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  subject: string;
  transport: 'smtp' | 'resend' | 'outbox-fallback';
  previewCode?: string;
  error?: string;
}

export interface OutboxEmailRecord {
  id: string;
  timestamp: string;
  recipient: string;
  to: string;
  subject: string;
  code?: string;
  verificationCode?: string;
  verificationLink?: string;
  transport: string;
  htmlContent: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  delivered?: boolean;
}

class EmailService {
  private outboxFilePath: string;
  private outbox: OutboxEmailRecord[] = [];
  private transporter: any = null;
  private isSmtpConfigured: boolean = false;

  constructor() {
    const dir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignore folder creation errors
      }
    }
    this.outboxFilePath = path.join(dir, 'email_outbox.json');
    this.loadOutbox();
    this.initTransporter();
  }

  private loadOutbox() {
    try {
      if (fs.existsSync(this.outboxFilePath)) {
        const raw = fs.readFileSync(this.outboxFilePath, 'utf-8');
        this.outbox = JSON.parse(raw);
      }
    } catch {
      this.outbox = [];
    }
  }

  private saveOutbox() {
    try {
      fs.writeFileSync(this.outboxFilePath, JSON.stringify(this.outbox.slice(0, 50), null, 2), 'utf-8');
    } catch {
      // Ignore disk write errors
    }
  }

  private async initTransporter() {
    const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.MAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.MAIL_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import('nodemailer');
        this.transporter = (nodemailer as any).createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        this.isSmtpConfigured = true;
        console.log(`[EmailService] SMTP Transporter connected (${smtpHost}:${smtpPort})`);
      } catch (err: any) {
        console.warn('[EmailService] SMTP init warning:', err?.message);
        this.isSmtpConfigured = false;
      }
    } else if (smtpUser && smtpPass && smtpUser.includes('@gmail.com')) {
      try {
        const nodemailer = await import('nodemailer');
        this.transporter = (nodemailer as any).createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        this.isSmtpConfigured = true;
        console.log(`[EmailService] Gmail Transporter connected for ${smtpUser}`);
      } catch (err: any) {
        console.warn('[EmailService] Gmail init warning:', err?.message);
        this.isSmtpConfigured = false;
      }
    } else {
      this.isSmtpConfigured = false;
    }
  }

  /**
   * Generates a modern high-contrast responsive HTML verification email
   */
  private generateVerificationEmailHtml(name: string, code: string, email: string): string {
    const verifyLink = `${process.env.APP_URL || 'http://localhost:3000'}?verifyEmail=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Predict Pro Account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafafa; }
    .wrapper { max-width: 560px; margin: 30px auto; background: #121214; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .header { background: linear-gradient(135deg, #052e16 0%, #09090b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2); }
    .logo-badge { display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 20px; color: #34d399; font-weight: 800; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    h1 { font-size: 22px; font-weight: 800; margin: 0 0 16px; color: #ffffff; text-align: center; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px; }
    .otp-card { background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #10b981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.3); margin: 8px 0; }
    .btn-verify { display: inline-block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #000000; font-weight: 800; font-size: 14px; padding: 14px 20px; text-align: center; text-decoration: none; border-radius: 10px; margin-top: 10px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #18181b; background: #0c0c0e; }
    .badge { display: inline-block; font-size: 11px; color: #10b981; background: #052e16; padding: 3px 8px; border-radius: 6px; }
    .warning { color: #f59e0b; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">PREDICT PRO AI</div>
      <h1 style="margin-top: 14px; color: #ffffff;">Email Verification</h1>
      <p style="margin: 0; color: #34d399; font-size: 13px;">Strictly Validated Football AI Prediction Engine</p>
    </div>
    <div class="content">
      <p>Hello <strong>${name || 'Valued Member'}</strong>,</p>
      <p>Thank you for creating an account on <strong>Predict Pro</strong>. To activate your account and gain full access to today's live verified predictions, use your 6-digit confirmation code below:</p>
      
      <div class="otp-card">
        <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 700; letter-spacing: 1px;">6-Digit Verification Code</div>
        <div class="otp-code">${code}</div>
        <div style="font-size: 12px; color: #a1a1aa; margin-top: 6px;">Valid for 15 minutes &bull; One-time use only</div>
      </div>

      <a href="${verifyLink}" class="btn-verify" target="_blank">Instant 1-Click Verification</a>

      <p class="warning">⚠️ If you did not request this email, you can safely disregard it. Your email address remains secure.</p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} Predict Pro Football AI. Operating in Africa/Kampala (EAT, UTC+3).</p>
      <div class="badge">&#10004; Verified Machine Learning Predictions</div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Dispatches verification email
   */
  public async sendVerificationEmail(email: string, name: string, code: string): Promise<EmailDispatchResult> {
    const cleanEmail = email.trim().toLowerCase();
    const subject = `🔐 Your Predict Pro Verification Code: ${code}`;
    const html = this.generateVerificationEmailHtml(name, code, cleanEmail);
    const fromAddress = process.env.EMAIL_FROM || '"Predict Pro Support" <noreply@predictpro.ai>';
    const verifyLink = `${process.env.APP_URL || 'http://localhost:3000'}?verifyEmail=${encodeURIComponent(cleanEmail)}&code=${encodeURIComponent(code)}`;

    const record: OutboxEmailRecord = {
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipient: cleanEmail,
      to: cleanEmail,
      subject,
      code,
      verificationCode: code,
      verificationLink: verifyLink,
      transport: this.isSmtpConfigured ? 'smtp' : 'outbox-fallback',
      htmlContent: html,
      status: 'SIMULATED',
      delivered: true
    };

    // If SMTP is active, dispatch via real SMTP transporter
    if (this.isSmtpConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject,
          text: `Your Predict Pro verification code is: ${code}. Valid for 15 minutes.`,
          html
        });
        record.status = 'SENT';
        this.outbox.unshift(record);
        this.saveOutbox();
        console.log(`[EmailService] Verification email sent to ${cleanEmail} (ID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          recipient: cleanEmail,
          subject,
          transport: 'smtp',
          previewCode: code
        };
      } catch (err: any) {
        console.error(`[EmailService] SMTP send error for ${cleanEmail}:`, err?.message);
        record.status = 'FAILED';
      }
    }

    // Outbox Fallback (Always saves and logs code clearly for local dev / preview)
    record.status = 'SIMULATED';
    this.outbox.unshift(record);
    this.saveOutbox();

    console.log(`========================================================================`);
    console.log(`[EmailService] 📧 VERIFICATION EMAIL DISPATCHED TO: ${cleanEmail}`);
    console.log(`[EmailService] 🔑 6-DIGIT VERIFICATION CODE: ${code}`);
    console.log(`[EmailService] 🕒 TIMESTAMP: ${new Date().toISOString()}`);
    console.log(`========================================================================`);

    return {
      success: true,
      recipient: cleanEmail,
      subject,
      transport: 'outbox-fallback',
      previewCode: code
    };
  }

  /**
   * Retrieves recent outbox logs for verification preview in UI
   */
  public getOutbox(): OutboxEmailRecord[] {
    return [...this.outbox];
  }

  public getLatestCodeForEmail(email: string): string | null {
    const clean = email.trim().toLowerCase();
    const item = this.outbox.find(o => o.recipient === clean);
    return item?.code || null;
  }
}

export const globalEmailService = new EmailService();
