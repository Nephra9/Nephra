import React from 'react'
import { motion } from 'framer-motion'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

const Team = () => {
  const teamMembers = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Executive Director',
      bio: 'Leading researcher in AI and machine learning with over 15 years of experience.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      email: 'sarah.chen@nephra.org',
      linkedin: 'https://linkedin.com/in/sarahchen'
    },
    {
      name: 'Prof. Michael Rodriguez',
      role: 'Head of Engineering',
      bio: 'Expert in distributed systems and cloud computing architectures.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      email: 'michael.rodriguez@nephra.org',
      linkedin: 'https://linkedin.com/in/michaelrodriguez'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Head of Analytics',
      bio: 'Specialist in big data analytics and visualization techniques.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      email: 'emily.watson@nephra.org',
      linkedin: 'https://linkedin.com/in/emilywatson'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Our Team
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Meet the passionate leaders and researchers who make Nephra possible.
            </p>
          </motion.div>
        </div>
      </section>

     {/* Team Members */}
<section className="py-24">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col md:flex-row gap-10">
      
      {/* LEFT DIV - 30% */}
      <div className={`md:w-[30%] md:h-[] w-full flex flex-col justify-center `} style={{backgroundColor:"black"}}>
       hdsjhf
      </div>

      {/* RIGHT DIV - 70% */}
      <div className={`md:w-[70%] w-full grid gap-8 sm:grid-cols-2 lg:grid-cols-3`}style={{backgroundColor:"white"}}>
       kfhdku
      </div>

    </div>
  </div>
</section>

    </div>
  )
}

export default Team
