import mongoose from 'mongoose';
import { imageSchema } from '../../utils/imageSchema.js';
import { ownerField } from '../../utils/contentFields.js';

const SOCIAL_KEYS = ['github', 'linkedin', 'twitter', 'facebook', 'instagram'];

const socialsSchema = new mongoose.Schema(
  {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
  },
  { _id: false },
);

const settingSchema = new mongoose.Schema(
  {
    // Marks one settings row per tenant (the legacy root site keeps `singleton`).
    key: {
      type: String,
      default: 'singleton',
      unique: true,
      immutable: true,
    },
    // Tenant owner — null for the legacy root site.
    owner: ownerField,
    heroTitle: { type: String, default: 'Saker Ahmed Hridoy' },
    heroSubtitle: { type: String, default: 'Full-Stack Web Developer' },
    aboutShort: { type: String, default: '' },
    aboutImage: { type: imageSchema, default: () => ({}) }, // <-- নতুন About Section Image
    heroImage: { type: imageSchema, default: () => ({}) },
    avatar: { type: imageSchema, default: () => ({}) },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    location: { type: String, default: '' },
    socials: { type: socialsSchema, default: () => ({}) },
    bkashNumber: { type: String, default: '' },
    bkashNote: { type: String, default: 'Send Money to this bKash Personal number & enter your TrxID below' },

    resumeUrl: { type: String, default: '' },
    socialLinks: { type: [mongoose.Schema.Types.Mixed], default: () => [] },
    aboutCards: {
      type: [
        {
          title: { type: String, trim: true, default: '' },
          subtitle: { type: String, trim: true, default: '' },
        },
      ],
      default: () => [],
    },
    profileImage: { type: imageSchema, default: () => ({}) },
    siteName: { type: String, default: 'SakerHridoy' },
    contactSubtitle: { type: String, default: '', trim: true },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    tabTitle: { type: String, default: 'SakerHridoy - webDeveloper' },
    profession: { type: String, default: '' },
    siteTitle: { type: String, default: '' },
    logo: { type: imageSchema, default: () => ({}) },
    logoUrl: { type: String, default: '' },
    favicon: { type: imageSchema, default: () => ({}) },
    ogImage: { type: imageSchema, default: () => ({}) },
    // Hero section floating bubble icons — array of uploaded images
    bubbleIcons: { type: [imageSchema], default: () => [] },
    themePreset: {
      type: String,
      default: 'cyan',
      enum: ['cyan', 'violet', 'gold'],
    },
    themeMode: {
      type: String,
      default: 'dark',
      enum: ['dark', 'light'],
    },

  },
  { timestamps: true },
);

settingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.key;
    return ret;
  },
});

settingSchema.statics.SOCIAL_KEYS = SOCIAL_KEYS;

export const Setting = mongoose.model('Setting', settingSchema);

export default Setting;