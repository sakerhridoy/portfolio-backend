# SakerHridoy Admin Backend

Node.js + Express + MongoDB backend for the SakerHridoy portfolio admin system.

## Tech stack

- **Runtime:** Node.js (>=18), ESM (`"type": "module"`)
- **Framework:** Express 4
- **Database:** MongoDB via Mongoose 8
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` password hashing
- **Security:** `helmet`, `cors` (allowlist), `express-rate-limit`, input validation via `express-validator`
- **Misc:** `compression`, `morgan`, `dotenv`, `slugify`

## Architecture

Feature-based MVC. Each feature lives in `src/features/<feature>/` and contains:

- `<feature>.routes.js` — route definitions + validation
- `<feature>.controller.js` — thin request/response layer
- `<feature>.service.js` — business logic
- `<feature>.model.js` — Mongoose schema/model

Cross-cutting concerns live in `src/middleware/` and `src/utils/`.

```
server/
  package.json
  .env.example
  .gitignore
  README.md
  src/
    server.js                       # boot: load env, connect DB, listen, graceful shutdown
    app.js                          # builds + exports the express app (no listen)
    config/
      env.js                        # reads + validates env, exports frozen config
      db.js                         # mongoose connect / disconnect
      cloudinary.js                 # cloudinary SDK setup (optional feature)
    middleware/
      auth.js                       # protect, optionalAuth, requireRole
      error.js                      # notFound + errorHandler
      validate.js                   # express-validator wrapper
      rateLimit.js                  # globalLimiter + strictLimiter
    utils/
      ApiError.js
      asyncHandler.js
      token.js
      pagination.js
      contentFields.js              # shared status/order fields + JSON transform
      contentCrud.js                # factory: service + controller + router for content collections
      imageSchema.js                # shared Cloudinary image sub-schema
    features/
      auth/         user.model.js  auth.routes.js  auth.controller.js  auth.service.js
      projects/     project.model.js  project.routes.js  project.controller.js  project.service.js
      leads/        lead.model.js  lead.routes.js  lead.controller.js  lead.service.js
      settings/     setting.model.js  setting.routes.js  setting.controller.js  setting.service.js
      plans/        plan.model.js  plan.routes.js
      testimonials/ testimonial.model.js  testimonial.routes.js
      faqs/         faq.model.js  faq.routes.js
      blog/         blogPost.model.js  blogPost.routes.js
      experience/   experience.model.js  experience.routes.js
      achievements/ achievement.model.js  achievement.routes.js
      timeline/     timeline.model.js  timeline.routes.js
      resume/       resume.model.js  resume.service.js  resume.controller.js  resume.routes.js
      uploads/      upload.controller.js  upload.routes.js
    seed/
      seedAdmin.js
  tests/
    smoke.test.js
```

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit values
```

Required environment variables (see `.env.example`):

| Variable         | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `PORT`           | HTTP port (default `5000`)                              |
| `NODE_ENV`       | `development` \| `production` \| `test`                 |
| `MONGODB_URI`    | MongoDB connection string                               |
| `JWT_SECRET`     | Secret used to sign JWTs (mandatory in production)      |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `7d`                                 |
| `CLIENT_ORIGIN`  | Comma-separated CORS allowlist, e.g. `http://localhost:5173` |
| `ADMIN_EMAIL`    | First admin email (used by the seed script)             |
| `ADMIN_PASSWORD` | First admin password (used by the seed script)          |
| `ADMIN_NAME`     | First admin display name                                |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (uploads)                 |
| `CLOUDINARY_API_KEY`    | Cloudinary API key (uploads)                     |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (uploads)                  |
| `CLOUDINARY_FOLDER`     | Upload folder (default `sakerhridoy`)            |

Uploads are optional: leave the Cloudinary variables blank and the API still boots,
but `POST /api/uploads` responds `503` until they are set.

## Scripts

```bash
npm run dev      # nodemon dev server
npm start        # production start
npm run seed     # create the first admin user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run smoke    # offline smoke test (node --test + supertest), no live DB needed
```

## Response shape

Success (single):

```json
{ "success": true, "data": { } }
```

Success (paginated list):

```json
{ "success": true, "data": [ ], "meta": { "page": 1, "limit": 10, "total": 0, "pages": 0 } }
```

Error:

```json
{ "success": false, "message": "..." }
```

## Endpoints

Base path: `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

### Health

| Method | Path          | Access | Description           |
| ------ | ------------- | ------ | --------------------- |
| GET    | `/api/health` | Public | Returns `{ status: 'ok' }` |

### Auth

| Method | Path                   | Access      | Body                                   | Description                          |
| ------ | ---------------------- | ----------- | -------------------------------------- | ------------------------------------ |
| POST   | `/api/auth/login`      | Public      | `{ email, password }`                  | Returns `{ token, user }`            |
| GET    | `/api/auth/me`         | Auth        | —                                      | Current user                         |
| POST   | `/api/auth/register`   | Admin       | `{ name, email, password, role }`      | Create user (`role`: admin/editor)   |
| GET    | `/api/auth/users`      | Admin       | — (`page`, `limit`, `search`)          | List users                           |
| PATCH  | `/api/auth/users/:id`  | Admin       | `{ name, role, isActive, password }`   | Update a user                        |
| DELETE | `/api/auth/users/:id`  | Admin       | —                                      | Delete a user                        |
| PATCH  | `/api/auth/password`   | Auth        | `{ currentPassword, newPassword }`     | Change own password                  |

`login` and `register` responses return `user` as `{ id, name, email, role, slug, profession, siteTitle, siteFavicon, logoUrl }`.

Safety guards on user management: you cannot remove your own admin access or delete your
own account, and the last active admin cannot be demoted, deactivated or deleted
(`400 At least one active admin must remain`).

### User Profiles & Public Portfolios

| Method | Path                         | Access | Description                                                     |
| ------ | ---------------------------- | ------ | --------------------------------------------------------------- |
| GET    | `/api/users/profile/:username` | Public | Returns user's dynamic profile and their published projects     |
| GET    | `/api/users/:username`       | Public | Alias for `/api/users/profile/:username`                        |
| PATCH  | `/api/users/profile`         | Auth   | Update authenticated user's own profile (profession, siteTitle, favicon, logo) |

User fields:
- `name` (String, required)
- `email` (String, required)
- `slug` (String, unique)
- `role` (`admin` | `editor`)
- `isActive` (Boolean)
- `profession` (String, e.g. "Full-Stack Web Developer" or "UI/UX Designer")
- `siteTitle` (String, custom site header/tab title)
- `siteFavicon` (String, favicon URL)
- `logoUrl` (String, custom logo URL)

### Projects

| Method | Path                        | Access | Description                                                    |
| ------ | --------------------------- | ------ | -------------------------------------------------------------- |
| GET    | `/api/projects`             | Public | List. Query: `page, limit, category, status, featured, search, sort` |
| GET    | `/api/projects/:idOrSlug`   | Public | Single **published** project                                   |
| POST   | `/api/projects`             | Admin  | Create                                                          |
| PUT    | `/api/projects/:id`         | Admin  | Full update                                                     |
| DELETE | `/api/projects/:id`         | Admin  | Delete                                                          |
| PATCH  | `/api/projects/reorder`     | Admin  | `{ items: [{ id, order }] }` bulk reorder                       |

Project fields:
- `title`, `slug`, `description`, `category`, `techStack[]`, `images[]`, `video`, `order`, `featured`, `status`
- Dynamic Links:
  - `githubLink` (String, synced with `repoUrl` for backwards compatibility)
  - `liveLink` (String, synced with `liveUrl` for backwards compatibility)
  - `youtubeLink` (String, synced with `videoUrl` for backwards compatibility)
  - `facebookLink` (String)
  - `customLinks` (Array of `{ label: String, url: String }`)

- Public list defaults to `status=published`.
- `status=all` (returns every status) requires an admin token.
- `sort` supports `-field` (desc), `field:desc`, or comma-separated fields.

### Leads

| Method | Path                         | Access | Description                                        |
| ------ | ---------------------------- | ------ | -------------------------------------------------- |
| POST   | `/api/leads`                 | Public | Create lead (strict rate limit)                    |
| GET    | `/api/leads`                 | Admin  | List. Query: `page, limit, status, search, sort`   |
| GET    | `/api/leads/:id`             | Admin  | Single lead                                        |
| PATCH  | `/api/leads/:id`             | Admin  | `{ status }` update status                         |
| DELETE | `/api/leads/:id`             | Admin  | Delete                                             |
| GET    | `/api/leads/stats/summary`   | Admin  | Counts grouped by status                           |

Lead `status`: `new` \| `read` \| `replied` \| `archived`.
Lead `source`: `contact` \| `whatsapp`.

### Settings

| Method | Path             | Access | Description                                     |
| ------ | ---------------- | ------ | ----------------------------------------------- |
| GET    | `/api/settings`  | Public | Singleton settings (created with defaults on first read) |
| PUT    | `/api/settings`  | Admin  | Update singleton                                |

Settings fields: `heroTitle`, `heroSubtitle`, `aboutShort`, `email`, `phone`, `whatsapp`,
`location`, `resumeUrl`, `siteName`, `footerText`, `seoTitle`, `seoDescription`,
`socials.{github,linkedin,twitter,facebook,instagram}`, `ogImage.{url,publicId}`.

### Content collections (Phase 2)

`plans`, `testimonials`, `faqs`, `blog`, `experience`, `achievements` and `timeline`
share one identical contract. Every item has `order` (number) and `status`
(`published` | `draft`); public reads only ever see `published` items.

| Method | Path                       | Access | Description                                     |
| ------ | -------------------------- | ------ | ----------------------------------------------- |
| GET    | `/api/<collection>`        | Public | List published items. Query: `page, limit, search, sort, status` |
| GET    | `/api/<collection>/:id`    | Public | Single published item (`404` for drafts unless admin) |
| POST   | `/api/<collection>`        | Admin  | Create                                          |
| PUT    | `/api/<collection>/:id`    | Admin  | Full update                                     |
| DELETE | `/api/<collection>/:id`    | Admin  | Delete                                          |
| PATCH  | `/api/<collection>/reorder`| Admin  | `{ items: [{ id, order }] }` bulk reorder       |

- `status=all` requires an admin token; without one it returns `403`.
- Collection-specific fields:

| Collection     | Path                 | Fields                                                              |
| -------------- | -------------------- | ------------------------------------------------------------------- |
| Plans          | `/api/plans`         | `title`, `icon`, `price`, `period`, `highlight`, `features[]`, `ctaLabel`, `ctaHref` |
| Testimonials   | `/api/testimonials`  | `name`, `role`, `review`, `avatar {url,publicId}`, `rating` (1–5)    |
| FAQs           | `/api/faqs`          | `question`, `answer`                                                |
| Blog           | `/api/blog`          | `title`, `slug`, `category`, `excerpt`, `content`, `coverImage {url,publicId}`, `publishedAt` |
| Experience     | `/api/experience`    | `title`, `description`, `duration`, `icon`                          |
| Achievements   | `/api/achievements`  | `title`, `institution`, `description`, `year`, `icon`               |
| Timeline       | `/api/timeline`      | `year`, `title`, `description`                                      |

- `icon` is a stable key the frontend maps to an icon component:
  - Plans: `bolt` `star` `crown` `rocket` `gem` `shield`
  - Experience: `briefcase` `code` `cpu` `table` `layout` `star`
  - Achievements: `certificate` `trophy` `globe` `medal` `award`

### Resume

| Method | Path            | Access | Description                                          |
| ------ | --------------- | ------ | ---------------------------------------------------- |
| GET    | `/api/resume`   | Public | Singleton resume (created with defaults on first read) |
| PUT    | `/api/resume`   | Admin  | Update singleton                                     |

Fields: `intro`, `experience[]`, `education[]` (each `{ title, period, description }`),
`stats[]` (`{ label, value, description }`).

### Uploads

| Method | Path            | Access | Description                                       |
| ------ | --------------- | ------ | ------------------------------------------------- |
| POST   | `/api/uploads`  | Admin  | `multipart/form-data`, field `file` (image, max 5MB) → `{ url, publicId, width, height, format, bytes }` |
| DELETE | `/api/uploads`  | Admin  | Body `{ publicId }` → removes the asset from Cloudinary |

Returns `503` when Cloudinary credentials are not configured.

## Security notes

- Helmet sets secure HTTP headers; CORS is restricted to `CLIENT_ORIGIN` allowlist.
- Global rate limiter on all `/api` routes; stricter limiter on `POST /api/auth/login` and `POST /api/leads`.
- The central error handler maps mongoose `CastError`/`ValidationError`/duplicate-key and JWT errors to clean `400`/`409`/`401` JSON and never leaks stack traces to clients.
- All input is validated; invalid requests return `400` with a clear message.
- No secrets are hardcoded — everything comes from `src/config/env.js`.
