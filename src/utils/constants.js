// utils/constants.js
export const COLOR_PALETTE = {
  primary: '#0F62FE',
  accent: '#7F53FF',
  secondary: '#00BDA5',
  background: {
    light: '#F8FAFC',
    dark: '#0F1724'
  },
  surface: {
    light: '#FFFFFF',
    dark: '#0B1220'
  }
}

export const STORAGE_BUCKETS = {
  PROJECT_IMAGES: 'project-images',
  AVATARS: 'avatars',
  RESUMES: 'resumes',
  ATTACHMENTS: 'attachments'
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB