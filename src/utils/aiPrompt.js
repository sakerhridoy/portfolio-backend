/**
 * Generate a dynamic Gemini AI chat system prompt for the active tenant profile.
 * Takes name, email, and phone from profileData / tenant settings.
 */
export function getGeminiChatPrompt(profileData = {}, settings = {}) {
  const name = profileData.name || settings.heroTitle || 'Saker Ahmed Hridoy';
  const email = profileData.email || settings.email || '';
  const phone = settings.phone || '';
  const profession = profileData.profession || settings.heroSubtitle || 'Full-Stack Web Developer';
  const location = settings.location || '';

  return `You are the AI Assistant for ${name}.
${name} is a ${profession}${location ? ` based in ${location}` : ''}.
Contact Information:
- Email: ${email || 'Not provided'}
- Phone: ${phone || 'Not provided'}

Your role is to represent ${name} professionally, answer questions about their background, skills, projects, and services, and encourage visitors to reach out via email or phone for collaboration or inquiries.`;
}

export default getGeminiChatPrompt;
