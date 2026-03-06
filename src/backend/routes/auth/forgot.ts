import createError from 'http-errors';
import { db } from '@db';
import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { mail, RootUrl, GmailUsername } from '@config';

export async function forgot(app: FastifyInstance) {
  app.post<{ Body: { email: string } }>('/forgot', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string' } }
      }
    }
  }, async (req) => {
    const { email } = req.body;
    // we never return an error because of security reasons, even if the email doesn't exist in our database
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true };
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    await db.resetPasswordToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, createdAt: new Date() },
      create: { userId: user.id, tokenHash }
    });
    const resetLink = `${RootUrl}/reset-password?token=${verifyToken}`;
    const subject = 'Password Reset Request';
    const text = `A password reset was requested for your account "${user.username}". Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`;
    const html = `<div style="font-family: sans-serif; background:#f5f5f5; padding:24px;"><div style="max-width:480px; margin:0 auto; background:#ffffff; border:1px solid #ddd; padding:32px 24px; text-align:center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <img src="https://checklist.spoi.org.in/images/favicon.png" width="32" height="32" alt="OI Checklist" style="margin-bottom:16px;" />
    <div style="font-size:18px; font-weight:600; margin-bottom:20px; color:#333;">OI Checklist</div>
    <div style="font-size:14px; color:#666; margin-bottom:20px; line-height:1.4;">A password reset was requested for your account <strong>${user.username}</strong>. Click the button below to reset your password.</div>
    <a href="${resetLink}" style="display:inline-block; padding:10px 16px; background:#007bff; color:#ffffff; text-decoration:none; font-weight:600; border:1px solid #0056b3; transition:background-color 0.2s;">Reset Password</a>
    <div style="font-size:12px; color:#666; margin-top:28px; word-break:break-all; line-height:1.4;">If the button doesn't work, open this link:<br/>${resetLink}</div>
    <div style="font-size:12px; color:#999; margin-top:20px;">If you didn't request this email, you can safely ignore it.</div></div></div>`;
    await mail.send({
      from: `OI Checklist <${GmailUsername}>`,
      to: email,
      subject,
      text,
      html
    });
    return { success: true };
  });

  // /forgot/confirm is used to verify the token and allow the user to reset their password
  app.post<{ Body: { token: string; newPassword: string } }>('/forgot/confirm', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await db.resetPasswordToken.findUnique({ where: { tokenHash } });
    if (!resetToken) {
      throw createError.BadRequest('Invalid token');
    }
    const userId = resetToken.userId;
    await db.user.update({
      where: { id: userId },
      data: {
        password: crypto.createHash('sha256').update(newPassword).digest('hex')
      }
    });
    await db.resetPasswordToken.delete({ where: { userId } });
    return { success: true };
  });
}