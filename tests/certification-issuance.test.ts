import { describe, it, expect } from "vitest"

describe("Certification Issuance Contract", () => {
  // Mock contract state
  const certifications = new Map()
  const studentCertificates = new Map()
  let nextCertId = 1
  
  // Mock functions
  const issueCertificate = (educator, student, courseId, certificateHash) => {
    const certId = nextCertId++
    
    certifications.set(certId, {
      student,
      courseId,
      educator,
      issueDate: Date.now(),
      certificateHash,
      valid: true,
    })
    
    const existing = studentCertificates.get(student) || []
    existing.push(certId)
    studentCertificates.set(student, existing)
    
    return { ok: certId }
  }
  
  const revokeCertificate = (educator, certId) => {
    const cert = certifications.get(certId)
    if (!cert) {
      return { error: "ERR_NOT_AUTHORIZED" }
    }
    if (cert.educator !== educator) {
      return { error: "ERR_NOT_AUTHORIZED" }
    }
    
    cert.valid = false
    return { ok: true }
  }
  
  const verifyCertificate = (certId, expectedHash) => {
    const cert = certifications.get(certId)
    if (!cert) {
      return { error: "ERR_NOT_AUTHORIZED" }
    }
    
    const isValid = cert.valid && cert.certificateHash === expectedHash
    return { ok: isValid }
  }
  
  const isCertificateValid = (certId) => {
    const cert = certifications.get(certId)
    return cert ? cert.valid : false
  }
  
  const getStudentCertificates = (student) => {
    return studentCertificates.get(student) || []
  }
  
  it("should issue certificates to students", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    const hash = "abc123def456"
    
    const result = issueCertificate(educator, student, 1, hash)
    
    expect(result.ok).toBe(1)
    expect(certifications.has(1)).toBe(true)
    expect(getStudentCertificates(student)).toContain(1)
  })
  
  it("should allow educators to revoke their certificates", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    issueCertificate(educator, student, 1, "hash123")
    const result = revokeCertificate(educator, 1)
    
    expect(result.ok).toBe(true)
    expect(isCertificateValid(1)).toBe(false)
  })
  
  it("should prevent unauthorized certificate revocation", () => {
    const educator1 = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const educator2 = "SP3HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ2F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    issueCertificate(educator1, student, 1, "hash123")
    const result = revokeCertificate(educator2, 1)
    
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
})
