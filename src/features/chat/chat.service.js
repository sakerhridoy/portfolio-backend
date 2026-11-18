import { getSettings } from '../settings/setting.service.js';
import { User } from '../auth/user.model.js';
import { getGeminiChatPrompt } from '../../utils/aiPrompt.js';

export async function processChatMessage({ message, ownerId }) {
  const settings = await getSettings(ownerId);
  const user = ownerId ? await User.findById(ownerId) : null;
  
  const profileData = user ? {
    name: user.name,
    email: user.email,
    profession: user.profession || settings.heroSubtitle,
  } : {
    name: settings.heroTitle,
    email: settings.email,
    profession: settings.heroSubtitle,
  };

  const systemPrompt = getGeminiChatPrompt(profileData, settings);

  const lower = String(message || '').toLowerCase();
  let reply = `Hello! I am ${profileData.name}'s AI Assistant. How can I help you today? You can reach ${profileData.name} directly at ${profileData.email || 'their email'} or phone ${settings.phone || 'N/A'}.`;

  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('reach')) {
    reply = `You can contact ${profileData.name} via email at ${profileData.email || 'N/A'} or phone at ${settings.phone || 'N/A'}. Location: ${settings.location || 'N/A'}.`;
  } else if (lower.includes('project') || lower.includes('work') || lower.includes('portfolio')) {
    reply = `${profileData.name} is a ${profileData.profession}. You can explore their portfolio projects right here on the website!`;
  } else if (lower.includes('skills') || lower.includes('stack') || lower.includes('technology')) {
    reply = `${profileData.name} specializes in modern development, design, and creating scalable digital experiences.`;
  }

  return {
    reply,
    systemPrompt,
    tenant: {
      name: profileData.name,
      email: profileData.email,
      phone: settings.phone,
    },
  };
}
