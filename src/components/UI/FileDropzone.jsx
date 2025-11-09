// components/UI/FileDropzone.jsx
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../services/supabaseClient'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { STORAGE_BUCKETS, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../../utils/constants'

const FileDropzone = ({ onUploadComplete, multiple = false, bucket = STORAGE_BUCKETS.PROJECT_IMAGES }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const { user } = useAuth()

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return
    // require authenticated user for uploads (server policies may enforce this)
    if (!user) {
      toast.error('You must be signed in to upload files')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

  if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        return {
          name: file.name,
          path: filePath,
          url: publicUrl,
          size: file.size,
          type: file.type
        }
      })

      const results = await Promise.all(uploadPromises)
      onUploadComplete(multiple ? results : results[0])
    } catch (error) {
      console.error('Error uploading file:', error)
      // Surface server error to user when possible
      const msg = error?.message || error?.error || String(error)
      toast.error(`Upload failed: ${msg}`)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadComplete, multiple, bucket])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    multiple
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Uploading... {progress}%
          </p>
        </div>
      ) : (
        <div>
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4 flex text-sm text-gray-600 dark:text-gray-400">
            <p className="pl-1">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag and drop files here, or click to select files'}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            PNG, JPG, WEBP up to 10MB
          </p>
        </div>
      )}
    </div>
  )
}

export default FileDropzone