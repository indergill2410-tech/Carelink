export type WorkerRole = 'NURSE' | 'EN' | 'PCA'

export type ComplianceDocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'MISSING'

export type ComplianceDocType =
  | 'POLICE_CHECK'
  | 'WORKING_WITH_CHILDREN'
  | 'FIRST_AID'
  | 'IMMUNISATION'
  | 'ID_PROOF'
  | 'NURSING_REGISTRATION'

export type ComplianceDocumentLike = {
  docType: string
  status: ComplianceDocStatus | string
  expiresAt?: Date | string | null
}

export const COMPLIANCE_DOCUMENTS: Array<{
  key: ComplianceDocType
  label: string
  expires: boolean
}> = [
  { key: 'POLICE_CHECK', label: 'Police Check', expires: true },
  { key: 'WORKING_WITH_CHILDREN', label: 'Working With Children Check', expires: true },
  { key: 'FIRST_AID', label: 'First Aid Certificate', expires: true },
  { key: 'IMMUNISATION', label: 'Immunisation Record', expires: true },
  { key: 'NURSING_REGISTRATION', label: 'AHPRA Registration', expires: true },
  { key: 'ID_PROOF', label: 'Photo ID', expires: false },
]

export const ALL_COMPLIANCE_DOC_TYPES = COMPLIANCE_DOCUMENTS.map(doc => doc.key)

const BASE_REQUIRED_DOCS: ComplianceDocType[] = [
  'POLICE_CHECK',
  'WORKING_WITH_CHILDREN',
  'FIRST_AID',
  'IMMUNISATION',
  'ID_PROOF',
]

export function getRequiredComplianceDocTypes(role: string): ComplianceDocType[] {
  if (role === 'NURSE' || role === 'EN') {
    return [...BASE_REQUIRED_DOCS, 'NURSING_REGISTRATION']
  }
  return BASE_REQUIRED_DOCS
}

export function isDocumentExpired(doc: ComplianceDocumentLike, now = new Date()): boolean {
  if (doc.status === 'EXPIRED') return true
  if (!doc.expiresAt) return false
  const expiresAt = doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt)
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime()
}

export function getEffectiveDocumentStatus(doc?: ComplianceDocumentLike, now = new Date()): ComplianceDocStatus {
  if (!doc) return 'MISSING'
  if (isDocumentExpired(doc, now)) return 'EXPIRED'
  if (doc.status === 'APPROVED' || doc.status === 'PENDING' || doc.status === 'REJECTED') return doc.status
  return 'MISSING'
}

export function getComplianceStatusForDocuments(
  role: string,
  documents: ComplianceDocumentLike[],
  now = new Date(),
): 'GREEN' | 'AMBER' | 'RED' {
  const required = getRequiredComplianceDocTypes(role)
  const byType = new Map(documents.map(doc => [doc.docType, doc]))
  const statuses = required.map(docType => getEffectiveDocumentStatus(byType.get(docType), now))

  if (statuses.every(status => status === 'APPROVED')) return 'GREEN'
  if (statuses.some(status => status === 'REJECTED' || status === 'EXPIRED' || status === 'MISSING')) return 'RED'
  return 'AMBER'
}

export type ExpiryBucket = 'EXPIRED' | 'EXPIRING_SOON' | 'VALID' | 'NO_EXPIRY'

/** Whole days from `now` until the document expires. Negative = already expired. */
export function getDaysUntilExpiry(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): number | null {
  if (!expiresAt) return null
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000)
}

/** Classify a document by how close it is to expiry. `soonDays` defaults to 30. */
export function getExpiryBucket(
  doc: ComplianceDocumentLike,
  now = new Date(),
  soonDays = 30,
): ExpiryBucket {
  const days = getDaysUntilExpiry(doc.expiresAt, now)
  if (days === null) return 'NO_EXPIRY'
  if (days < 0) return 'EXPIRED'
  if (days <= soonDays) return 'EXPIRING_SOON'
  return 'VALID'
}

export function getComplianceProgress(role: string, documents: ComplianceDocumentLike[], now = new Date()) {
  const required = getRequiredComplianceDocTypes(role)
  const byType = new Map(documents.map(doc => [doc.docType, doc]))
  const approved = required.filter(docType => getEffectiveDocumentStatus(byType.get(docType), now) === 'APPROVED')

  return {
    approved: approved.length,
    total: required.length,
    percent: required.length === 0 ? 100 : Math.round((approved.length / required.length) * 100),
  }
}
