import React, { useEffect, useState } from 'react'
import formatDate from '../../utils/formatDate'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import toast from 'react-hot-toast'

const UserProfile = () => {
  const { profile, loading, isAuthenticated, user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    institution: '',
    degree: '',
    department: '',
    bio: '',
    country: '',
    phone: '',
    profile_url: '',
    resume_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  

  useEffect(() => {
    console.log('Profile - Auth state:', { 
      isAuthenticated, 
      loading, 
      user: user?.id, 
      profile: profile?.id 
    })
  }, [isAuthenticated, loading, user, profile])

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        institution: profile.institution || '',
        degree: profile.degree || '',
        department: profile.department || '',
        bio: profile.bio || '',
        country: profile.country || '',
        phone: profile.phone || '',
        profile_url: profile.profile_url || '',
        resume_url: profile.resume_url || ''
      })
      setImagePreview(profile.profile_url || null)
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async () => {
    if (!selectedImage || !user) return null

    try {
      setUploadingImage(true)
      
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedImage)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Upload image if selected
      let imageUrl = formData.profile_url
      if (selectedImage) {
        imageUrl = await uploadImage()
        if (imageUrl) {
          setFormData(prev => ({ ...prev, profile_url: imageUrl }))
        }
      }

      const result = await updateProfile({
        ...formData,
        profile_url: imageUrl
      })
      
      if (result.success) {
        setIsEditing(false)
        setSelectedImage(null)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to access this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card>
            <Card.Content className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                User Profile
              </h1>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "primary"}
                  size="sm"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h3>
                    
                    {/* Profile Picture Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Profile preview"
                              className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-200"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            JPG, PNG or GIF. Max size 5MB.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Institution
                        </label>
                        <input
                          type="text"
                          name="institution"
                          value={formData.institution}
                          onChange={handleInputChange}
                          placeholder="e.g., Stanford University"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Degree
                        </label>
                        <input
                          type="text"
                          name="degree"
                          value={formData.degree}
                          onChange={handleInputChange}
                          placeholder="e.g., Bachelor of Science in Computer Science"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          placeholder="e.g., Computer Science Department"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="e.g., United States"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g., +1 (555) 123-4567"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Professional Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Tell us about yourself, your interests, and goals..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Resume URL
                        </label>
                        <input
                          type="url"
                          name="resume_url"
                          value={formData.resume_url}
                          onChange={handleInputChange}
                          placeholder="e.g., https://yourwebsite.com/resume.pdf"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      loading={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information Display */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        {profile?.profile_url ? (
                          <img
                            src={profile.profile_url}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                            <span className="text-gray-400 dark:text-gray-500 text-lg font-medium">
                              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {profile?.full_name || 'User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{profile?.email}</p>
                        <div className="flex space-x-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {profile?.role || 'user'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            profile?.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {profile?.status || 'active'}
                          </span>
                          {profile?.email_verified && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information Display */}
                  {(profile?.institution || profile?.degree || profile?.department || profile?.country) && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Academic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile?.institution && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Institution</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile.institution}</p>
                          </div>
                        )}
                        {profile?.degree && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Degree</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile.degree}</p>
                          </div>
                        )}
                        {profile?.department && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile.department}</p>
                          </div>
                        )}
                        {profile?.country && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                            <p className="text-gray-900 dark:text-white font-medium">{profile.country}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information Display */}
                  {profile?.phone && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h4>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-gray-900 dark:text-white font-medium">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Professional Information Display */}
                  {(profile?.bio || profile?.profile_url || profile?.resume_url) && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Professional Information</h4>
                      {profile?.bio && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Bio</p>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{profile.bio}</p>
                        </div>
                      )}
                      {profile?.resume_url && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Resume URL</p>
                          <a 
                            href={profile.resume_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 break-all"
                          >
                            {profile.resume_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Information */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Member since</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Last login</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {profile?.last_login_at ? formatDate(profile.last_login_at) : (profile?.last_sign_in_at ? formatDate(profile.last_sign_in_at) : 'N/A')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </Card.Content>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default UserProfile

