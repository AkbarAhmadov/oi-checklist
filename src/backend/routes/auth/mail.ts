import createError from 'http-errors';
import { db } from '@db';
import { FastifyInstance } from 'fastify';
import { mail as mailSender } from '@config';
import crypto from 'crypto';
import { RootUrl, GmailUsername } from '@config';

export async function mail(app: FastifyInstance) {
  app.post<{ Body: { token: string; email: string } }>('/mail/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'email'],
        properties: {
          token: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { token, email } = req.body;
    const session = await db.session.findUnique({ where: { id: token } });
    if (!session) {
      throw createError.BadRequest('Invalid token');
    }
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (user.email) {
      throw createError.Conflict('An email is already linked to this account.');
    }
    if (await db.user.findUnique({ where: { email } })) {
      throw createError.Conflict('That email is already in use.');
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    await db.pendingEmail.upsert({
      where: { userId: user.id },
      update: { email, tokenHash, createdAt: new Date() },
      create: { userId: user.id, email, tokenHash }
    });
    const link = `${RootUrl}/verify?token=${verifyToken}`;
    const subject = "Verify your email";
    const text = `Verify your email for OI Checklist\n\nOpen this link to verify your email:\n${link}\n\nIf you didn't request this, you can ignore this email.`;
    const html = `<div style="font-family: sans-serif; background:#f5f5f5; padding:24px;"><div style="max-width:480px; margin:0 auto; background:#ffffff; border:1px solid #ddd; padding:32px 24px; text-align:center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <img src="https://checklist.spoi.org.in/images/favicon.png" width="32" height="32" alt="OI Checklist" style="margin-bottom:16px;" />
    <div style="font-size:18px; font-weight:600; margin-bottom:20px; color:#333;">OI Checklist</div>
    <div style="font-size:14px; color:#666; margin-bottom:20px; line-height:1.4;">Click the button below to verify your email.</div>
    <a href="${link}" style="display:inline-block; padding:10px 16px; background:#007bff; color:#ffffff; text-decoration:none; font-weight:600; border:1px solid #0056b3; transition:background-color 0.2s;">Verify Email</a>
    <div style="font-size:12px; color:#666; margin-top:28px; word-break:break-all; line-height:1.4;">If the button doesn't work, open this link:<br/>${link}</div>
    <div style="font-size:12px; color:#999; margin-top:20px;">If you didn't request this email, you can safely ignore it.</div></div></div>`;
    await mailSender.send({
      from: `OI Checklist <${GmailUsername}>`,
      to: email,
      subject,
      text,
      html
    });
  });

  app.post<{ Body: { token: string, emailToken: string } }>('/mail/confirm', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'emailToken'],
        properties: {
          token: { type: 'string' },
          emailToken: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const { token, emailToken } = req.body;
    const session = await db.session.findUnique({ where: { id: token } });
    if (!session) {
      throw createError.BadRequest('Invalid token');
    }
    // check if the emailToken exists in the db, and if so, we can just update the user's email and delete the pendingEmail entry
    const tokenHash = crypto.createHash('sha256').update(emailToken).digest('hex');
    const pendingEmail = await db.pendingEmail.findFirst({ where: { tokenHash } });
    if (!pendingEmail) {
      throw createError.BadRequest('Invalid email verification token');
    }
    // no need to check time validity of the token, since we will just delete it after use
    await db.user.update({ where: { id: session.userId }, data: { email: pendingEmail.email } });
    await db.pendingEmail.delete({ where: { userId: session.userId } });
    return { success: true };
  });

  app.post<{ Body: { token: string } }>('/mail/unlink', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } }
      }
    }
  }, async (req) => {
    const { token } = req.body;
    const session = await db.session.findUnique({ where: { id: token } });
    if (!session) {
      throw createError.BadRequest('Invalid token');
    }
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user.email) {
      throw createError.BadRequest('No email linked to this account');
    }
    await db.user.update({ where: { id: session.userId }, data: { email: null } });
    return { success: true };
  });
}