import { describe, expect, it } from 'vitest'
import {
  getComplianceProgress,
  getComplianceStatusForDocuments,
  getEffectiveDocumentStatus,
  getRequiredComplianceDocTypes,
} from '@/lib/compliance'

const baseApprovedDocs = [
  { docType: 'POLICE_CHECK', status: 'APPROVED' },
  { docType: 'WORKING_WITH_CHILDREN', status: 'APPROVED' },
  { docType: 'FIRST_AID', status: 'APPROVED' },
  { docType: 'IMMUNISATION', status: 'APPROVED' },
  { docType: 'ID_PROOF', status: 'APPROVED' },
] as const

describe('compliance rules', () => {
  it('requires AHPRA registration for RN and EN workers only', () => {
    expect(getRequiredComplianceDocTypes('NURSE')).toContain('NURSING_REGISTRATION')
    expect(getRequiredComplianceDocTypes('EN')).toContain('NURSING_REGISTRATION')
    expect(getRequiredComplianceDocTypes('PCA')).not.toContain('NURSING_REGISTRATION')
  })

  it('marks PCA compliant without AHPRA when base documents are approved', () => {
    expect(getComplianceStatusForDocuments('PCA', [...baseApprovedDocs])).toBe('GREEN')
  })

  it('keeps RN incomplete until AHPRA is approved', () => {
    expect(getComplianceStatusForDocuments('NURSE', [...baseApprovedDocs])).toBe('RED')
    expect(getComplianceStatusForDocuments('NURSE', [
      ...baseApprovedDocs,
      { docType: 'NURSING_REGISTRATION', status: 'APPROVED' },
    ])).toBe('GREEN')
  })

  it('treats pending required documents as amber and expired documents as red', () => {
    expect(getComplianceStatusForDocuments('PCA', [
      ...baseApprovedDocs.filter(doc => doc.docType !== 'FIRST_AID'),
      { docType: 'FIRST_AID', status: 'PENDING' },
    ])).toBe('AMBER')

    expect(getEffectiveDocumentStatus({
      docType: 'FIRST_AID',
      status: 'APPROVED',
      expiresAt: '2020-01-01T00:00:00.000Z',
    }, new Date('2026-01-01T00:00:00.000Z'))).toBe('EXPIRED')

    expect(getComplianceStatusForDocuments('PCA', [
      ...baseApprovedDocs.filter(doc => doc.docType !== 'FIRST_AID'),
      { docType: 'FIRST_AID', status: 'APPROVED', expiresAt: '2020-01-01T00:00:00.000Z' },
    ], new Date('2026-01-01T00:00:00.000Z'))).toBe('RED')
  })

  it('reports progress against role-specific required documents', () => {
    expect(getComplianceProgress('PCA', [...baseApprovedDocs])).toEqual({
      approved: 5,
      total: 5,
      percent: 100,
    })
    expect(getComplianceProgress('EN', [...baseApprovedDocs])).toEqual({
      approved: 5,
      total: 6,
      percent: 83,
    })
  })
})
