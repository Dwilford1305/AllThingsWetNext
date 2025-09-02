// Simple email utility stub; replace with real provider integration later
export async function sendEmail(to: string, subject: string, text: string) {
  try {
    // In production, integrate with a transactional email service.
    console.info('[Email] To:', to, '\nSubject:', subject, '\nBody:\n', text)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
