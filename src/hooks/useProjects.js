import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import toast from 'react-hot-toast'

export const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching projects from Supabase...')
      
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching projects:', fetchError)
        throw fetchError
      }

      console.log('Projects fetched successfully:', data)
      setProjects(data || [])
    } catch (err) {
      console.error('Error in fetchProjects:', err)
      setError(err.message)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()

      if (error) throw error

      setProjects(prev => [data[0], ...prev])
      return data[0]
    } catch (err) {
      console.error('Error creating project:', err)
      throw err
    }
  }

  const updateProject = async (projectId, projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId)
        .select()

      if (error) throw error

      setProjects(prev => prev.map(p => p.id === projectId ? data[0] : p))
      return data[0]
    } catch (err) {
      console.error('Error updating project:', err)
      throw err
    }
  }

  const deleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (err) {
      console.error('Error deleting project:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}