import { Setting } from './setting.model.js';
import { User } from '../auth/user.model.js';

const EMPTY_OWNER = '000000000000000000000000';

const SAKER_DEFAULTS = {
  heroTitle: 'Saker Ahmed Hridoy',
  heroSubtitle: 'Full-Stack Web Developer',
  siteName: 'SakerHridoy',
  tabTitle: 'SakerHridoy - webDeveloper',
};

const TENANT_PRESETS = {
  sumaiya: {
    heroTitle: 'Sumaiya Tazeen',
    heroSubtitle: 'Graphic & UI/UX Designer',
    siteName: 'SumaiyaTazeen',
    tabTitle: 'SumaiyaTazeen - graphic&ui/ux designer',
    aboutShort:
      'I design interfaces and brand visuals with a focus on layout, type, and how people move through a screen.',
  },
};

function identityForUser(user) {
  if (!user) return null;
  if (TENANT_PRESETS[user.slug]) return TENANT_PRESETS[user.slug];
  return {
    heroTitle: user.name,
    heroSubtitle: '',
    siteName: user.name,
    tabTitle: user.name,
    aboutShort: '',
  };
}

function stillUsingSakerDefaults(settings) {
  return (
    settings.heroTitle === SAKER_DEFAULTS.heroTitle &&
    settings.heroSubtitle === SAKER_DEFAULTS.heroSubtitle &&
    settings.siteName === SAKER_DEFAULTS.siteName &&
    settings.tabTitle === SAKER_DEFAULTS.tabTitle
  );
}

const SCALAR_FIELDS = [
  'themePreset',

  'heroTitle',
  'heroSubtitle',
  'profession',
  'aboutShort',
  'contactSubtitle',
  'email',
  'phone',
  'whatsapp',
  'location',
  'resumeUrl',
  'siteName',
  'siteTitle',
  'footerText',
  'seoTitle',
  'seoDescription',
  'tabTitle',
  'logoUrl',
];

// Each tenant gets its own settings row; the legacy root site keeps `singleton`.
const keyFor = (ownerId) => (ownerId ? `user:${ownerId}` : 'singleton');

/**
 * Return the settings document for the active tenant, creating it with
 * defaults on first read.
 */
export async function getSettings(ownerId = null) {
  if (ownerId && String(ownerId) === EMPTY_OWNER) {
    return {
      heroTitle: '',
      heroSubtitle: '',
      aboutShort: '',
      siteName: '',
      tabTitle: '',
      footerText: '',
      email: '',
      phone: '',
      whatsapp: '',
      location: '',
      resumeUrl: '',
      socials: {},
      profileImage: {},
      favicon: {},
      bubbleIcons: [],
    };
  }

  const key = keyFor(ownerId);
  let settings = await Setting.findOne({ key });
  const user = ownerId ? await User.findById(ownerId).select('name slug') : null;
  const identity = user && user.slug !== 'saker' ? identityForUser(user) : null;

  if (!settings) {
    settings = await Setting.create({
      key,
      owner: ownerId,
      ...(identity || {}),
    });
    return settings;
  }

  // A new tenant used to inherit Saker's schema defaults. Replace that copy
  // once, and only while every branded field is still untouched.
  if (identity && stillUsingSakerDefaults(settings)) {
    settings.heroTitle = identity.heroTitle;
    settings.heroSubtitle = identity.heroSubtitle;
    settings.siteName = identity.siteName;
    settings.tabTitle = identity.tabTitle;
    if (!settings.aboutShort) settings.aboutShort = identity.aboutShort || '';
    await settings.save();
  }

  return settings;
}

export async function updateSettings(payload = {}, ownerId = null) {
  const settings = await getSettings(ownerId);

  for (const field of SCALAR_FIELDS) {
    if (payload[field] !== undefined) {
      settings[field] = payload[field];
    }
  }

  if (payload.socials && typeof payload.socials === 'object') {
    const current = settings.socials ? settings.socials.toObject() : {};
    for (const [key, value] of Object.entries(payload.socials)) {
      if (Setting.SOCIAL_KEYS.includes(key)) current[key] = value;
    }
    settings.socials = current;
  }

  if (payload.ogImage && typeof payload.ogImage === 'object') {
    settings.ogImage = {
      url: payload.ogImage.url ?? settings.ogImage?.url ?? '',
      publicId: payload.ogImage.publicId ?? settings.ogImage?.publicId ?? '',
    };
  }

  if (payload.profileImage && typeof payload.profileImage === 'object') {
    settings.profileImage = {
      url: payload.profileImage.url ?? settings.profileImage?.url ?? '',
      publicId: payload.profileImage.publicId ?? settings.profileImage?.publicId ?? '',
    };
  }

  if (payload.heroImage && typeof payload.heroImage === 'object') {
    settings.heroImage = {
      url: payload.heroImage.url ?? settings.heroImage?.url ?? '',
      publicId: payload.heroImage.publicId ?? settings.heroImage?.publicId ?? '',
    };
  }

  if (payload.aboutImage && typeof payload.aboutImage === 'object') {
    settings.aboutImage = {
      url: payload.aboutImage.url ?? settings.aboutImage?.url ?? '',
      publicId: payload.aboutImage.publicId ?? settings.aboutImage?.publicId ?? '',
    };
  }

  if (payload.avatar && typeof payload.avatar === 'object') {
    settings.avatar = {
      url: payload.avatar.url ?? settings.avatar?.url ?? '',
      publicId: payload.avatar.publicId ?? settings.avatar?.publicId ?? '',
    };
  }

  if (payload.favicon && typeof payload.favicon === 'object') {
    settings.favicon = {
      url: payload.favicon.url ?? settings.favicon?.url ?? '',
      publicId: payload.favicon.publicId ?? settings.favicon?.publicId ?? '',
    };
  }

  if (payload.logo && typeof payload.logo === 'object') {
    settings.logo = {
      url: payload.logo.url ?? settings.logo?.url ?? '',
      publicId: payload.logo.publicId ?? settings.logo?.publicId ?? '',
    };
    if (settings.logo.url) {
      settings.logoUrl = settings.logo.url;
    }
  }

  if (payload.logoUrl !== undefined) {
    settings.logoUrl = payload.logoUrl;
    if (!settings.logo?.url) {
      settings.logo = { url: payload.logoUrl, publicId: '' };
    }
  }

  // Handle bubbleIcons array — filter out empty entries
  if (payload.bubbleIcons !== undefined) {
    settings.bubbleIcons = Array.isArray(payload.bubbleIcons)
      ? payload.bubbleIcons
          .filter(item => item?.url)
          .map(item => ({ url: item.url, publicId: item.publicId || '' }))
      : settings.bubbleIcons;
  }

  // Handle socialLinks array
  if (payload.socialLinks !== undefined) {
    settings.socialLinks = Array.isArray(payload.socialLinks)
      ? payload.socialLinks.map(link => ({
          label: link.label || '',
          url: link.url || '',
          icon: {
            url: link.icon?.url || '',
            publicId: link.icon?.publicId || '',
          },
        }))
      : settings.socialLinks;
  }

  // Handle aboutCards array
  if (payload.aboutCards !== undefined) {
    settings.aboutCards = Array.isArray(payload.aboutCards)
      ? payload.aboutCards.map(card => ({
          title: card.title || '',
          subtitle: card.subtitle || '',
        }))
      : settings.aboutCards;
  }


  // Cross-field synchronization for consistent display
  if (payload.profession !== undefined) {
    settings.profession = payload.profession;
    if (!payload.heroSubtitle) settings.heroSubtitle = payload.profession;
  }
  if (payload.siteTitle !== undefined) {
    settings.siteTitle = payload.siteTitle;
    if (!payload.tabTitle) settings.tabTitle = payload.siteTitle;
    if (!payload.siteName) settings.siteName = payload.siteTitle;
  }

  await settings.save();

  // If a tenant owner exists, keep User model in sync
  if (ownerId) {
    const userUpdate = {};
    if (payload.profession !== undefined) userUpdate.profession = payload.profession;
    if (payload.siteTitle !== undefined) userUpdate.siteTitle = payload.siteTitle;
    if (settings.favicon?.url) userUpdate.siteFavicon = settings.favicon.url;
    if (settings.logoUrl || settings.logo?.url) userUpdate.logoUrl = settings.logoUrl || settings.logo?.url;
    if (settings.profileImage?.url) userUpdate.profileImage = settings.profileImage;
    if (settings.heroImage?.url) userUpdate.heroImage = settings.heroImage;
    if (settings.aboutImage?.url) userUpdate.aboutImage = settings.aboutImage;
    if (settings.avatar?.url) userUpdate.avatar = settings.avatar;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(ownerId, userUpdate);
    }
  }

  return settings;
}
