;; Certification Issuance Contract
;; Issues and manages learning certifications

(define-constant ERR_NOT_AUTHORIZED (err u400))
(define-constant ERR_INSUFFICIENT_PROGRESS (err u401))
(define-constant ERR_ALREADY_CERTIFIED (err u402))

;; Data structures
(define-map certifications
  uint
  {
    student: principal,
    course-id: uint,
    educator: principal,
    issue-date: uint,
    certificate-hash: (buff 32),
    valid: bool
  }
)

(define-map student-certificates
  principal
  (list 100 uint)
)

(define-data-var next-cert-id uint u1)

;; Public functions
(define-public (issue-certificate
  (student principal)
  (course-id uint)
  (certificate-hash (buff 32)))
  (let ((cert-id (var-get next-cert-id)))
    ;; In real implementation, verify educator authorization and student completion
    (map-set certifications cert-id {
      student: student,
      course-id: course-id,
      educator: tx-sender,
      issue-date: block-height,
      certificate-hash: certificate-hash,
      valid: true
    })

    ;; Add to student's certificate list
    (match (map-get? student-certificates student)
      existing-certs
        (map-set student-certificates student
          (unwrap-panic (as-max-len? (append existing-certs cert-id) u100)))
      ;; First certificate
      (map-set student-certificates student (list cert-id))
    )

    (var-set next-cert-id (+ cert-id u1))
    (ok cert-id)
  )
)

(define-public (revoke-certificate (cert-id uint))
  (let ((cert-data (unwrap! (map-get? certifications cert-id) ERR_NOT_AUTHORIZED)))
    (asserts! (is-eq tx-sender (get educator cert-data)) ERR_NOT_AUTHORIZED)
    (map-set certifications cert-id (merge cert-data { valid: false }))
    (ok true)
  )
)

(define-public (verify-certificate (cert-id uint) (expected-hash (buff 32)))
  (let ((cert-data (unwrap! (map-get? certifications cert-id) ERR_NOT_AUTHORIZED)))
    (ok (and
      (get valid cert-data)
      (is-eq (get certificate-hash cert-data) expected-hash)
    ))
  )
)

;; Read-only functions
(define-read-only (get-certificate (cert-id uint))
  (map-get? certifications cert-id)
)

(define-read-only (get-student-certificates (student principal))
  (default-to (list) (map-get? student-certificates student))
)

(define-read-only (is-certificate-valid (cert-id uint))
  (match (map-get? certifications cert-id)
    cert-data (get valid cert-data)
    false
  )
)

(define-read-only (count-valid-certificates (student principal))
  (let ((cert-list (get-student-certificates student)))
    (fold count-valid cert-list u0)
  )
)

(define-private (count-valid (cert-id uint) (acc uint))
  (if (is-certificate-valid cert-id)
    (+ acc u1)
    acc
  )
)
