import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import Button from '../components/UI/Button'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const FillProfile = () => {
  const navigate = useNavigate()
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileDone, setProfileDone] = useState(profile?.profile_done || false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    institution: profile?.institution || '',
    degree: profile?.degree || '',
    department: profile?.department || '',
    bio: profile?.bio || '',
    country: profile?.country || '',
    phone: profile?.phone || '',
    profile_url: profile?.profile_url || '',
    resume_url: profile?.resume_url || ''
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [profileImageFile, setProfileImageFile] = useState(null)

  useEffect(() => {
    // Redirect to dashboard if profile is already complete
    if (profile?.profile_done) {
      navigate('/dashboard', { replace: true })
    }
  }, [profile?.profile_done, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResumeUpload = async (file) => {
    if (!file || !user) return

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-resume.${fileExt}`
      const filePath = `resumes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        resume_url: data.publicUrl
      }))
      setResumeFile(file)
      toast.success('Resume uploaded successfully')
    } catch (error) {
      console.error('Resume upload error:', error)
      toast.error('Failed to upload resume')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageUpload = async (file) => {
    if (!file || !user) return

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-profile.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        profile_url: data.publicUrl
      }))
      setProfileImageFile(file)
      toast.success('Profile picture uploaded successfully')
    } catch (error) {
      console.error('Profile image upload error:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required')
      return false
    }
    if (!formData.institution.trim()) {
      toast.error('Institution is required')
      return false
    }
    if (!formData.degree.trim()) {
      toast.error('Degree is required')
      return false
    }
    if (!formData.department.trim()) {
      toast.error('Department is required')
      return false
    }
    if (!formData.country.trim()) {
      toast.error('Country is required')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      const updateData = {
        ...formData,
        profile_done: true
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      // Update the auth context profile
      await updateProfile({
        ...formData,
        profile_done: true
      })

      toast.success('Profile completed successfully!')
      setProfileDone(true)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Help us know more about you to personalize your experience
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Full Name <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
              />
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  Institution <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleInputChange}
                placeholder="e.g., University of Technology"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Degree */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                    Degree <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor of Engineering"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                    Department <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-blue-600" />
                    Country <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., India"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5 text-blue-600" />
                    Phone Number <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., +91-XXXXXXXXXX"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  Bio
                </div>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself... (Optional)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white transition resize-none"
              />
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-blue-600" />
                  Profile Picture
                </div>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleProfileImageUpload(e.target.files[0])
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition"
                />
                {formData.profile_url && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ Profile picture uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  Resume/CV
                </div>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleResumeUpload(e.target.files[0])
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition"
                />
                {formData.resume_url && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ Resume uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Completing...
                  </div>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </div>

            {/* Info */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default FillProfile
