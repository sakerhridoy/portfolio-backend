import { Resume } from './resume.model.js';

const LIST_FIELDS = ['experience', 'education', 'stats'];

// Each tenant gets its own resume row; the legacy root site keeps `singleton`.
const keyFor = (ownerId) => (ownerId ? `user:${ownerId}` : 'singleton');

/**
 * Return the resume document for the active tenant, creating it with defaults
 * on first read.
 */
export async function getResume(ownerId = null) {
  const key = keyFor(ownerId);
  let resume = await Resume.findOne({ key });
  if (!resume) {
    resume = await Resume.create({ key, owner: ownerId });
  }
  return resume;
}

export async function updateResume(payload = {}, ownerId = null) {
  const resume = await getResume(ownerId);

  if (payload.intro !== undefined) resume.intro = payload.intro;

  if (payload.resumeFile && typeof payload.resumeFile === 'object') {
    resume.resumeFile = {
      url: payload.resumeFile.url ?? resume.resumeFile?.url ?? '',
      publicId: payload.resumeFile.publicId ?? resume.resumeFile?.publicId ?? '',
      originalName: payload.resumeFile.originalName ?? resume.resumeFile?.originalName ?? '',
    };
  }

  for (const field of LIST_FIELDS) {
    if (Array.isArray(payload[field])) resume[field] = payload[field];
  }

  await resume.save();
  return resume;
}
