const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Configure transporter
const secure = process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Compile email template using Handlebars
const welcomeTemplateSource = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #4CAF50;">Welcome to the LMS, {{name}}!</h2>
    <p>Your account has been successfully created. Here are your login credentials:</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Institutional Email:</strong> {{lmsEmail}}</p>
      <p><strong>Temporary Password:</strong> {{password}}</p>
    </div>
    <p>Please log in using these credentials. You can change your password from your dashboard later.</p>
    <p>Best regards,<br>The LMS Administration</p>
  </div>
`;
const resetPasswordTemplateSource = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #F72263;">LMS Password Reset</h2>
    <p>Hello {{name}},</p>
    <p>Your LMS password has been reset successfully. Use the temporary password below to log in, then change your password from your dashboard.</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>LMS Email:</strong> {{lmsEmail}}</p>
      <p><strong>Temporary Password:</strong> {{password}}</p>
    </div>
    <p>If you did not request this change, please contact LMS support immediately.</p>
    <p>Best regards,<br>The LMS Administration</p>
  </div>
`;
const resetPasswordTemplate = handlebars.compile(resetPasswordTemplateSource);
const welcomeTemplate = handlebars.compile(welcomeTemplateSource);

/**
 * Send welcome email with credentials
 * @param {string} personalEmail - The recipient's personal email
 * @param {string} name - The user's name
 * @param {string} lmsEmail - The generated LMS email
 * @param {string} password - The temporary password
 */
const sendWelcomeEmail = async (personalEmail, name, lmsEmail, password) => {
  try {
    const htmlContent = welcomeTemplate({ name, lmsEmail, password });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LMS Admin" <admin@lms.local>',
      to: personalEmail,
      subject: "Welcome to LMS - Your Login Credentials",
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendPasswordResetEmail = async (personalEmail, name, lmsEmail, password) => {
  try {
    const htmlContent = resetPasswordTemplate({ name, lmsEmail, password });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LMS Admin" <admin@lms.local>',
      to: personalEmail,
      subject: "LMS Password Reset",
      html: htmlContent,
    });

    console.log("Password reset message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};


const assignmentTemplateSource = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #4CAF50;">New Assignment Uploaded!</h2>
    <p>Hello {{name}},</p>
    <p>A new assignment has been uploaded for your course <strong>{{courseName}}</strong>.</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Due Date:</strong> {{dueDate}}</p>
    </div>
    <p>Please log in to the LMS to view and complete your assignment.</p>
    <p>Best regards,<br>The LMS Administration</p>
  </div>
`;

const quizTemplateSource = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #F72263;">New Quiz Assigned!</h2>
    <p>Hello {{name}},</p>
    <p>A new quiz has been assigned for your course <strong>{{courseName}}</strong>.</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Time Limit:</strong> {{timeLimit}} minutes</p>
    </div>
    <p>Please log in to the LMS to take your quiz before the deadline.</p>
    <p>Best regards,<br>The LMS Administration</p>
  </div>
`;

const assignmentTemplate = handlebars.compile(assignmentTemplateSource);
const quizTemplate = handlebars.compile(quizTemplateSource);

const sendAssignmentNotification = async (personalEmail, name, courseName, title, dueDate) => {
  try {
    const htmlContent = assignmentTemplate({ name, courseName, title, dueDate });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LMS Admin" <admin@lms.local>',
      to: personalEmail,
      subject: `New Assignment: ${title}`,
      html: htmlContent,
    });
    console.log("Assignment email sent to %s: %s", personalEmail, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending assignment email:", error);
    return false;
  }
};

const sendQuizNotification = async (personalEmail, name, courseName, title, timeLimit) => {
  try {
    const htmlContent = quizTemplate({ name, courseName, title, timeLimit });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LMS Admin" <admin@lms.local>',
      to: personalEmail,
      subject: `New Quiz Assigned: ${title}`,
      html: htmlContent,
    });
    console.log("Quiz email sent to %s: %s", personalEmail, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending quiz email:", error);
    return false;
  }
};

module.exports = {
  sendAssignmentNotification,
  sendQuizNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
