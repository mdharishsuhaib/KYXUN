package com.kyxun.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        String subject = "Welcome to Kyxun — Your AI Study Planner! 🎓";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; background: #f4f7ff; padding: 30px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <h1 style="color: #4F46E5; margin-bottom: 8px;">Welcome, %s! 👋</h1>
                    <p style="color: #555; font-size: 16px;">
                      You're now part of <strong>Kyxun</strong> — the AI-powered academic planner built to help
                      you plan smarter, study better, and ace every exam.
                    </p>
                    <p style="color: #555;">Here's what you can do:</p>
                    <ul style="color: #555; line-height: 1.8;">
                      <li>📚 Manage your courses &amp; subjects</li>
                      <li>📅 Plan study sessions with our AI planner</li>
                      <li>🎯 Track tasks and exam schedules</li>
                      <li>🤖 Get AI-powered topic predictions for exams</li>
                    </ul>
                    <a href="%s" style="display: inline-block; margin-top: 20px; padding: 12px 30px;
                       background: #4F46E5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
                       Get Started →
                    </a>
                    <p style="margin-top: 30px; color: #aaa; font-size: 13px;">
                      Good luck with your studies! 🚀<br/>The Kyxun Team
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(firstName, frontendUrl);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String subject   = "Kyxun — Password Reset Request 🔐";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; background: #f4f7ff; padding: 30px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <h1 style="color: #4F46E5;">Password Reset</h1>
                    <p style="color: #555;">Hi %s,</p>
                    <p style="color: #555;">
                      We received a request to reset your password. Click the button below to set a new one.
                      This link expires in <strong>30 minutes</strong>.
                    </p>
                    <a href="%s" style="display: inline-block; margin-top: 16px; padding: 12px 30px;
                       background: #DC2626; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
                       Reset Password
                    </a>
                    <p style="margin-top: 24px; color: #888; font-size: 13px;">
                      If you didn't request this, please ignore this email. Your password won't change.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(firstName, resetLink);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Override
    @Async
    public void sendNotificationEmail(String toEmail, String subject, String body) {
        String htmlBody = """
                <html>
                <body style="font-family: Arial, sans-serif; background: #f4f7ff; padding: 30px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 40px;">
                    <h2 style="color: #4F46E5;">Kyxun Notification</h2>
                    <p style="color: #555;">%s</p>
                    <p style="margin-top: 30px; color: #aaa; font-size: 13px;">The Kyxun Team</p>
                  </div>
                </body>
                </html>
                """.formatted(body);

        sendHtmlEmail(toEmail, subject, htmlBody);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "Kyxun — AI Study Planner");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage());
        }
    }
}
