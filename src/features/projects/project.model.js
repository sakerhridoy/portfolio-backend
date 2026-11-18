import mongoose from 'mongoose';
import slugify from 'slugify';
import { ownerField } from '../../utils/contentFields.js';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '', trim: true },
    publicId: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const customLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    // Tenant owner — keeps `/saker` and `/sumaiya` portfolios separated.
    owner: ownerField,
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    techStack: {
      type: [String],
      default: [],
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    video: {
      type: imageSchema,
      default: () => ({}),
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    liveUrl: {
      type: String,
      default: '',
      trim: true,
    },
    repoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    githubLink: {
      type: String,
      default: '',
      trim: true,
    },
    liveLink: {
      type: String,
      default: '',
      trim: true,
    },
    youtubeLink: {
      type: String,
      default: '',
      trim: true,
    },
    facebookLink: {
      type: String,
      default: '',
      trim: true,
    },
    customLinks: {
      type: [customLinkSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['published', 'draft'],
        message: 'Status must be either published or draft',
      },
      default: 'published',
    },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, slug: 1, status: 1, order: 1 });
projectSchema.index({ owner: 1, status: 1, order: 1 });

// Safety net: guarantee links and slug exist.
projectSchema.pre('validate', function ensureProjectDefaults() {
  // Sync githubLink <-> repoUrl
  if (this.githubLink && !this.repoUrl) {
    this.repoUrl = this.githubLink;
  } else if (this.repoUrl && !this.githubLink) {
    this.githubLink = this.repoUrl;
  }

  // Sync liveLink <-> liveUrl
  if (this.liveLink && !this.liveUrl) {
    this.liveUrl = this.liveLink;
  } else if (this.liveUrl && !this.liveLink) {
    this.liveLink = this.liveUrl;
  }

  // Sync youtubeLink <-> videoUrl
  if (this.youtubeLink && !this.videoUrl) {
    this.videoUrl = this.youtubeLink;
  } else if (this.videoUrl && !this.youtubeLink) {
    this.youtubeLink = this.videoUrl;
  }

  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

export const Project = mongoose.model('Project', projectSchema);

export default Project;
