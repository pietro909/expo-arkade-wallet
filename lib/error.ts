export const extractError = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.response?.data?.error) return error.response.data.error
  if (error.message) {
    const match = error.message.match(/"message":"(.+)?"/)
    if (match && match.length > 1) return match[1]
    return error.message
  }
  return JSON.stringify(error)
}
