// src/hooks/useSupabase.js
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import toast from 'react-hot-toast'

export const useSupabase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const executeQuery = async (table, operation, data, options = {}) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(table)

      switch (operation) {
        case 'select':
          query = query.select(options.select || '*')
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending })
          }
          break

        case 'insert':
          query = query.insert(data)
          if (options.select) {
            query = query.select(options.select)
          }
          break

        case 'update':
          query = query.update(data)
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          if (options.select) {
            query = query.select(options.select)
          }
          break

        case 'delete':
          query = query.delete()
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          break

        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }

      const { data: result, error } = await query

      if (error) throw error
      return result
    } catch (err) {
      setError(err.message)
      console.error(`Supabase ${operation} error:`, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (bucket, file, path) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file)

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      console.error('File upload error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getPublicUrl = (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }

  return {
    loading,
    error,
    executeQuery,
    uploadFile,
    getPublicUrl
  }
}