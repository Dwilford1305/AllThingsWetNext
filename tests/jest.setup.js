// Jest setup file for mocking React components and JSX

// Mock React to prevent JSX parsing issues in node environment
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  // Mock React components that return JSX
  createElement: jest.fn(() => 'mocked-react-element'),
  Fragment: 'React.Fragment'
}))

// Mock React Email components
jest.mock('@react-email/components', () => ({
  Html: ({ children }) => children,
  Head: ({ children }) => children,
  Body: ({ children }) => children,
  Container: ({ children }) => children,
  Text: ({ children }) => children,
  Link: ({ children }) => children,
  Button: ({ children }) => children,
  Hr: () => '',
  Img: () => '',
  Preview: ({ children }) => children,
  Section: ({ children }) => children,
  Column: ({ children }) => children,
  Row: ({ children }) => children
}))

// Mock business components
jest.mock('@/components/BusinessDashboard', () => {
  return function MockBusinessDashboard() {
    return 'BusinessDashboard'
  }
})

jest.mock('@/components/BusinessRequestForm', () => {
  return function MockBusinessRequestForm() {
    return 'BusinessRequestForm'
  }
})

jest.mock('@/components/RequireAuth', () => {
  return function MockRequireAuth({ children }) {
    return children
  }
})

jest.mock('@/components/Dashboard', () => {
  return function MockDashboard() {
    return 'Dashboard'
  }
})

// Mock email templates to return simple strings
jest.mock('@/lib/email/templates/auth/EmailVerification', () => {
  return function MockEmailVerification() {
    return 'EmailVerification Template'
  }
})

jest.mock('@/lib/email/templates/auth/PasswordReset', () => {
  return function MockPasswordReset() {
    return 'PasswordReset Template'
  }
})

jest.mock('@/lib/email/templates/business/BusinessApproval', () => {
  return function MockBusinessApproval() {
    return 'BusinessApproval Template'
  }
})

jest.mock('@/lib/email/templates/business/BusinessRejection', () => {
  return function MockBusinessRejection() {
    return 'BusinessRejection Template'
  }
})

jest.mock('@/lib/email/templates/notifications/EventNotification', () => {
  return function MockEventNotification() {
    return 'EventNotification Template'
  }
})

// Mock email services
jest.mock('@/lib/emailService', () => ({
  EmailService: class MockEmailService {
    static async sendEmail() {
      return { messageId: 'mock-message-id' }
    }
    static isConfigured() {
      return true
    }
  }
}))

jest.mock('@/lib/email/services/ComprehensiveEmailService', () => ({
  default: class MockComprehensiveEmailService {
    static async queueEmail() {
      return { id: 'mock-email-id' }
    }
    static async processEmailQueue() {
      return true
    }
    static async isConfigured() {
      return true
    }
  }
}))

// Mock nodemailer
jest.mock('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
    }))
  }
}))

// Mock @react-email/render
jest.mock('@react-email/render', () => ({
  render: jest.fn(() => '<html>Mocked email HTML</html>')
}))

// Mock framer-motion components
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => children,
    section: ({ children, ...props }) => children,
    h1: ({ children, ...props }) => children,
    h2: ({ children, ...props }) => children,
    p: ({ children, ...props }) => children
  },
  AnimatePresence: ({ children }) => children
}))