;; Course Delivery Contract
;; Manages online course creation and delivery

(define-constant ERR_NOT_AUTHORIZED (err u200))
(define-constant ERR_COURSE_NOT_FOUND (err u201))
(define-constant ERR_ALREADY_ENROLLED (err u202))
(define-constant ERR_NOT_ENROLLED (err u203))

;; Data structures
(define-map courses
  uint
  {
    educator: principal,
    title: (string-ascii 100),
    description: (string-ascii 500),
    price: uint,
    max-students: uint,
    current-students: uint,
    active: bool
  }
)

(define-map enrollments
  { course-id: uint, student: principal }
  {
    enrolled-date: uint,
    completed: bool,
    progress: uint
  }
)

(define-data-var next-course-id uint u1)

;; Public functions
(define-public (create-course
  (title (string-ascii 100))
  (description (string-ascii 500))
  (price uint)
  (max-students uint))
  (let ((course-id (var-get next-course-id)))
    ;; In a real implementation, we'd check if educator is verified
    (map-set courses course-id {
      educator: tx-sender,
      title: title,
      description: description,
      price: price,
      max-students: max-students,
      current-students: u0,
      active: true
    })
    (var-set next-course-id (+ course-id u1))
    (ok course-id)
  )
)

(define-public (enroll-in-course (course-id uint))
  (let ((course-data (unwrap! (map-get? courses course-id) ERR_COURSE_NOT_FOUND)))
    (asserts! (is-none (map-get? enrollments { course-id: course-id, student: tx-sender })) ERR_ALREADY_ENROLLED)
    (asserts! (< (get current-students course-data) (get max-students course-data)) ERR_NOT_AUTHORIZED)

    (map-set enrollments { course-id: course-id, student: tx-sender } {
      enrolled-date: block-height,
      completed: false,
      progress: u0
    })

    (map-set courses course-id (merge course-data {
      current-students: (+ (get current-students course-data) u1)
    }))
    (ok true)
  )
)

(define-public (update-progress (course-id uint) (progress uint))
  (let ((enrollment-key { course-id: course-id, student: tx-sender }))
    (let ((enrollment-data (unwrap! (map-get? enrollments enrollment-key) ERR_NOT_ENROLLED)))
      (map-set enrollments enrollment-key (merge enrollment-data {
        progress: progress,
        completed: (>= progress u100)
      }))
      (ok true)
    )
  )
)

;; Read-only functions
(define-read-only (get-course (course-id uint))
  (map-get? courses course-id)
)

(define-read-only (get-enrollment (course-id uint) (student principal))
  (map-get? enrollments { course-id: course-id, student: student })
)

(define-read-only (is-enrolled (course-id uint) (student principal))
  (is-some (map-get? enrollments { course-id: course-id, student: student }))
)
