'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitContactForm(formData: FormData) {

  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const category = formData.get('category') as string;
    const message = formData.get('message') as string;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return { success: false, error: 'All required fields must be filled' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Send email using Resend
    await resend.emails.send({
      from: 'noreply@carscene.co.nz', // Use your verified domain
      to: 'support@carscene.co.nz',
      subject: `Contact Form: ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Category:</strong> ${category || 'Not specified'}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">Subject</h3>
            <p style="font-weight: 600; color: #212529;">${subject}</p>
            
            <h3 style="color: #495057;">Message</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 4px; font-size: 12px; color: #666;">
            <p style="margin: 0;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-NZ', { 
              timeZone: 'Pacific/Auckland',
              dateStyle: 'full',
              timeStyle: 'short'
            })}</p>
            <p style="margin: 5px 0 0 0;"><strong>From:</strong> Car Scene NZ Contact Form</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { 
      success: false, 
      error: 'Failed to send message. Please try again or email us directly.' 
    };
  }
}