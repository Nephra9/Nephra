// src/services/imageUploadService.js
import { supabase } from './supabaseClient'

export const imageUploadService = {
  async uploadImage(file, folder = 'branding') {
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPG, PNG, GIF, WebP, or SVG)')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit')
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${timestamp}-${randomString}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path)

      return publicData.publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      throw error
    }
  },

  async deleteImage(imageUrl) {
    try {
      // Extract path from URL
      if (!imageUrl) return

      // Parse the URL to get the file path
      const urlParts = imageUrl.split('/uploads/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('uploads')
        .remove([filePath])

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Image delete error:', error)
    }
  }
}
