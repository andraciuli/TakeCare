export function getUserDisplayName(user: {
  first_name: string | null
  last_name: string | null
  email: string
}): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  if (user.first_name) return user.first_name
  return user.email.split('@')[0]
}
