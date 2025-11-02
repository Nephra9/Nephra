import React from 'react'
import { motion } from 'framer-motion'
import { 
  AcademicCapIcon,
  UserGroupIcon,
  LightBulbIcon,
  GlobeAltIcon,
  ChartBarIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import Card from '../components/UI/Card'

const About = () => {
  const values = [
    {
      icon: AcademicCapIcon,
      title: 'Excellence in Education',
      description: 'We maintain the highest standards of academic excellence and research integrity in all our programs.'
    },
    {
      icon: UserGroupIcon,
      title: 'Collaborative Spirit',
      description: 'We believe in the power of collaboration and foster an inclusive environment where everyone can thrive.'
    },
    {
      icon: LightBulbIcon,
      title: 'Innovation',
      description: 'We encourage creative thinking and innovative solutions to address real-world challenges.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Impact',
      description: 'Our projects aim to create positive change and contribute to solving global challenges.'
    }
  ]

  const timeline = [
    {
      year: '2020',
      title: 'Foundation',
      description: 'Nephra was founded with the vision of democratizing access to cutting-edge technology education.'
    },
    {
      year: '2021',
      title: 'First Projects',
      description: 'Launched our first research projects in AI and machine learning with 50 student participants.'
    },
    {
      year: '2022',
      title: 'Expansion',
      description: 'Expanded to 25 partner universities and introduced projects in cybersecurity and IoT.'
    },
    {
      year: '2023',
      title: 'Recognition',
      description: 'Received industry recognition for innovation in technology education and student outcomes.'
    },
    {
      year: '2024',
      title: 'Future Vision',
      description: 'Continuing to expand our reach and impact, with plans for international partnerships.'
    }
  ]

  const stats = [
    { label: 'Students Served', value: '500+' },
    { label: 'Research Projects', value: '50+' },
    { label: 'Partner Universities', value: '25+' },
    { label: 'Countries', value: '15+' },
    { label: 'Success Rate', value: '95%' },
    { label: 'Industry Partners', value: '40+' }
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
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              About <span className="gradient-text">Nephra</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We are a leading technology education platform that connects talented students with innovative research projects, 
              providing hands-on experience and mentorship to build the next generation of technology leaders.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                At Nephra, we believe that technology has the power to transform lives and solve the world's most pressing challenges. 
                Our mission is to democratize access to cutting-edge technology education by connecting students with innovative research projects 
                and providing them with the mentorship, resources, and opportunities they need to succeed.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                We envision a world where every student, regardless of their background or location, has access to world-class technology education 
                and the opportunity to contribute to meaningful research that makes a difference.
              </p>
              <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                <HeartIcon className="h-6 w-6" />
                <span className="font-semibold">Making technology education accessible to all</span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Students collaborating on technology projects"
                  className="w-full h-64 object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              The principles that guide everything we do at Nephra.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <value.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Our Impact
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Numbers that reflect our commitment to excellence and student success.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Our Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Key milestones in our mission to transform technology education.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary-200 dark:bg-primary-800"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <Card className="p-6">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 mr-3">
                          {item.year}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </Card>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 h-4 w-4 bg-primary-600 dark:bg-primary-400 rounded-full border-4 border-white dark:border-gray-900"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join Our Mission
            </h2>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Be part of the next generation of technology innovators. Start your journey with Nephra today.
            </p>
            <div className="mt-10">
              <a
                href="/auth/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                Get Started Today
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default About
