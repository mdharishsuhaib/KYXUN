package com.kyxun.email;

public interface EmailService {

    void sendWelcomeEmail(String toEmail, String firstName);

    void sendPasswordResetEmail(String toEmail, String firstName, String resetToken);

    void sendNotificationEmail(String toEmail, String subject, String body);
}
