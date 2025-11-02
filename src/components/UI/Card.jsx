import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const Card = ({
  children,
  className = '',
  hover = false,
  clickable = false,
  onClick,
  padding = 'md',
  shadow = 'soft',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  }

  const shadowClasses = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    large: 'shadow-large'
  }

  const cardClasses = clsx(
    'rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    paddingClasses[padding],
    shadowClasses[shadow],
    {
      'transition-all duration-200 hover:shadow-medium': hover,
      'cursor-pointer': clickable
    },
    className
  )

  const MotionCard = motion.div

  const animationProps = hover || clickable ? {
    whileHover: { y: -2 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <MotionCard
      className={cardClasses}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </MotionCard>
  )
}

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)} {...props}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={clsx('text-sm text-gray-600 dark:text-gray-400', className)} {...props}>
    {children}
  </p>
)

const CardContent = ({ children, className = '', ...props }) => (
  <div className={clsx('', className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
