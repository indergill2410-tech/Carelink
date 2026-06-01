const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/

export function isValidE164Phone(phone: string): boolean {
  return E164_PHONE_REGEX.test(phone)
}
