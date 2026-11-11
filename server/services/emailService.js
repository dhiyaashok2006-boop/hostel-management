const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log(`📧 [Email Stub] To: ${to} | Subject: ${subject}`);
      return { success: true, stub: true };
    }
    const info = await transporter.sendMail({
      from: `"Hostel Management" <${process.env.EMAIL_USER}>`,
      to, subject, html, text
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false, error: err.message };
  }
};

const sendMaintenanceUpdate = (email, name, requestTitle, status) =>
  sendEmail({
    to: email,
    subject: `Maintenance Request Update: ${requestTitle}`,
    html: `<div style="font-family:sans-serif;padding:20px"><h2>Maintenance Update</h2><p>Hi ${name},</p><p>Your maintenance request "<strong>${requestTitle}</strong>" has been updated to: <strong>${status.toUpperCase()}</strong>.</p><p>Log in to your hostel portal for more details.</p></div>`
  });

const sendInvoiceNotification = (email, name, invoiceNumber, amount, dueDate) =>
  sendEmail({
    to: email,
    subject: `Invoice ${invoiceNumber} - Payment Due`,
    html: `<div style="font-family:sans-serif;padding:20px"><h2>Invoice Generated</h2><p>Hi ${name},</p><p>Invoice <strong>${invoiceNumber}</strong> for ₹${amount} has been generated.</p><p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p><p>Log in to your portal to view and pay.</p></div>`
  });

module.exports = { sendEmail, sendMaintenanceUpdate, sendInvoiceNotification };
