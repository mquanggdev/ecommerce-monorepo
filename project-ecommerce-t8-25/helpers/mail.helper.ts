import nodemailer from "nodemailer";
import { getApiAppPassword } from "../configs/setting.config";

export const sendMail = async (email: string, title: string, content: string) => {
  const apiAppPassword = await getApiAppPassword();
  
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    // Cổng 587 dùng STARTTLS: secure phải là false (secure: true chỉ dành cho cổng 465),
    // không liên quan web chạy HTTP hay HTTPS. requireTLS bắt buộc nâng lên kết nối mã hóa.
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: apiAppPassword.gmailUser,
      pass: apiAppPassword.gmailPassword,
    }
  });

  // Configure the mailoptions object
  const mailOptions = {
    from: apiAppPassword.gmailUser,
    to: email,
    subject: title,
    html: content
  };

  // Send the email
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent: ', info.response);
    }
  });
}