import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

// SMTP Configuration from Resend
const EMAIL_TO = 'support@gobeyondmeasure.org';
const EMAIL_FROM = 'noreply@kernfutures.ai';
const SMTP_OPTIONS = {
    host: 'smtp.resend.com',
    port: 465,
    secure: true, // Use true for port 465
    auth: {
        user: 'resend',
        pass: 're_JCsNReCb_PDLxKvseGmnPrMeTFkxpvHGV',
    },
};

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json();

        // Basic validation
        if (!name || !email || !subject || !message) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const transporter = nodemailer.createTransport(SMTP_OPTIONS);

        // Admin notification email
        const adminMailOptions = {
            from: `"${name}" <${EMAIL_FROM}>`, // Sender name from form
            replyTo: email,                   // Set reply-to to the user's email
            to: EMAIL_TO,                     // List of receivers
            subject: `Contact Form: ${subject}`, // Subject line
            text: `Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}`, // Plain text body
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                   <p><strong>Subject:</strong> ${subject}</p>
                   <hr>
                   <p><strong>Message:</strong></p>
                   <p>${message.replace(/\n/g, '<br>')}</p>`, // HTML body
        };

        // Confirmation email to the sender
        const confirmationMailOptions = {
            from: `"Beyond Measure" <${EMAIL_FROM}>`,
            to: email,
            subject: 'Thank you for contacting Beyond Measure',
            text: `Dear ${name},

Thank you for reaching out to Beyond Measure. We have received your message and will get back to you as soon as possible.

Here's a copy of your message:
Subject: ${subject}
Message:
${message}

Best regards,
The Beyond Measure Team
`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thank You for Contacting Beyond Measure</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                    <!-- Header with gradient background -->
                    <tr>
                        <td style="background: linear-gradient(to right, #3b82f6, #4f46e5); padding: 30px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px; line-height: 36px;">Beyond Measure</h1>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Thank you for reaching out</p>
                        </td>
                    </tr>
                    
                    <!-- Main content -->
                    <tr>
                        <td style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 24px;">Dear <strong>${name}</strong>,</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 24px;">We have received your message and will get back to you as soon as possible. Here's a copy of what you sent us:</p>
                                    </td>
                                </tr>
                                
                                <!-- Message box -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                            <tr>
                                                <td style="padding: 20px;">
                                                    <p style="margin: 0 0 10px; color: #4b5563; font-weight: bold;">Subject:</p>
                                                    <p style="margin: 0 0 20px; color: #374151;">${subject}</p>
                                                    <p style="margin: 0 0 10px; color: #4b5563; font-weight: bold;">Your message:</p>
                                                    <p style="margin: 0; color: #374151;">${message.replace(/\n/g, '<br>')}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Call to action -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="text-align: center; padding: 15px 0;">
                                                    <a href="https://gobeyondmeasure.org" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; font-weight: bold; padding: 12px 30px; border-radius: 6px;">Visit Our Website</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td>
                                        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 24px;">Best regards,<br><strong>The Beyond Measure Team</strong></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px;">
                            <p style="margin: 0 0 10px;">&copy; 2023 Beyond Measure. All rights reserved.</p>
                            <p style="margin: 0;">
                                <a href="https://gobeyondmeasure.org/privacy-policy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> | 
                                <a href="https://gobeyondmeasure.org/contact" style="color: #3b82f6; text-decoration: none;">Contact Us</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `
        };

        try {
            // Send both emails
            await Promise.all([
                transporter.sendMail(adminMailOptions),
                transporter.sendMail(confirmationMailOptions)
            ]);
            
            console.log('Emails sent successfully');
            return NextResponse.json({ 
                message: 'Your message has been sent. Check your inbox for a confirmation email.'
            }, { status: 200 });
        } catch (mailError: any) {
            console.error('Error sending email:', mailError);
            // Provide more specific error info if available
            const errorMessage = mailError.response || mailError.message || 'Internal server error during email sending';
            const errorStatus = mailError.responseCode || 500;
            return NextResponse.json({ message: `Failed to send email: ${errorMessage}` }, { status: errorStatus });
        }

    } catch (error) {
        console.error('Error processing contact form submission:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
} 