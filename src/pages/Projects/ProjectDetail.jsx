import React, { useState, useEffect } from 'react'
import formatDate from '../../utils/formatDate'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  TagIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../services/supabaseClient'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const ProjectDetail = () => {
  const { id } = useParams()
  const { isAuthenticated, profile } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await db.projects.getById(id)
      setProject(data)

      // Check if user has already applied
      if (isAuthenticated && profile) {
        const requests = await db.projectRequests.getByUser(profile.id)
        setHasApplied(requests.some(request => request.project_id === id))
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Project Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/projects">
            <Button>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-white dark:bg-gray-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link to="/projects" className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 mb-6">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" >
              <div className="lg:col-span-2" >
                <div className="flex items-center justify-between mb-4">

                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Open for Applications
                  </span>


                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Published on {formatDate(project.created_at)}
                  </div>
                </div>
                <div style={{ display: "flex",height:"100%"}}>
                  <div style={{height:"100%"}}>{/* Project Image */}

                    {project.image_url && (
                      <section className="py-12">

                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">


                          <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-full h-64 md:h-96 object-cover"
                            
                          />


                        </div>
                      </section>
                    )}</div>
                  <div style={{maxWidth:"500px"}}>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-6">
                      {project.title}
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                      {project.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                          <TagIcon className="h-4 w-4 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  {project.project_link && (
                    <a
                      href={project.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      <CodeBracketIcon className="h-4 w-4 mr-2" />
                      View Source Code
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  )}
                  {project.demo_link && (
                    <a
                      href={project.demo_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                      View Demo
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <Card.Content className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Apply to This Project
                    </h3>

                    {isAuthenticated ? (
                      hasApplied ? (
                        <div className="text-center">
                          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            You have already applied to this project.
                          </p>
                          <Link to="/dashboard/applications">
                            <Button variant="outline" size="sm" className="w-full">
                              View Application
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ready to join this project? Submit your application to get started.
                          </p>
                          <Link to={`/projects/${project.id}/apply`}>
                            <Button className="w-full mt-5">
                              Apply Now
                            </Button>
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Applications are reviewed by our team
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Sign in to apply for this project and join our community.
                        </p>
                        <div className="space-y-2">
                          <Link to="/auth/login">
                            <Button className="w-full">
                              Sign In to Apply
                            </Button>
                          </Link>
                          <Link to="/auth/signup">
                            <Button variant="outline" className="w-full">
                              Create Account
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Project Details */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Project Description
                </h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {/* Timeline */}
                {project.timeline && (
                  <Card>
                    <Card.Content className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Timeline
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.timeline}
                      </p>
                    </Card.Content>
                  </Card>
                )}

                {/* Tech Stack */}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <Card>
                    <Card.Content className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Technologies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.map((tech, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Team Members */}
                {project.team_members && project.team_members.length > 0 && (
                  <Card>
                    <Card.Content className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Team Members
                      </h3>
                      <div className="space-y-3">
                        {project.team_members.map((member, index) => (
                          <div key={index} className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                              <UserGroupIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Requirements */}
                {project.requirements && (
                  <Card>
                    <Card.Content className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Requirements
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.requirements}
                      </p>
                    </Card.Content>
                  </Card>
                )}

                {/* Expected Outcomes */}
                {project.outcomes && (
                  <Card>
                    <Card.Content className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Expected Outcomes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.outcomes}
                      </p>
                    </Card.Content>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProjectDetail
