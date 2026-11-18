import mongoose from 'mongoose';
import config from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User } from '../features/auth/user.model.js';
import { generateUniqueSlug } from '../utils/slug.js';

async function seedAdmin() {
  const { email, password, name } = config.admin;

  if (!email || !password) {
    console.error('[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      console.log(`[seed] Admin user already exists: ${normalizedEmail}`);
    } else {
      const passwordHash = await User.hashPassword(password);
      const slug = await generateUniqueSlug(User, name || normalizedEmail, { fallback: 'admin' });
      await User.create({
        name: name || 'Administrator',
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        isActive: true,
        slug,
      });
      console.log(`[seed] Created admin user: ${normalizedEmail} (slug: ${slug})`);
    }
  } catch (error) {
    console.error(`[seed] Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
