// Environment configuration
const config = {
  development: {
    apiUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    debug: true,
    logLevel: 'debug'
  },
  production: {
    apiUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    debug: false,
    logLevel: 'error'
  }
}

const environment = import.meta.env.MODE || 'development'
const currentConfig = config[environment] || config.development

// Validate required environment variables
const requiredEnvVars = ['apiUrl', 'apiKey']
const missingVars = requiredEnvVars.filter(varName => !currentConfig[varName])

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars)
  if (environment === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

export default currentConfig
