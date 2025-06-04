import { describe, it, expect } from "vitest"

describe("Course Delivery Contract", () => {
  // Mock contract state
  const courses = new Map()
  const enrollments = new Map()
  let nextCourseId = 1
  
  // Mock functions
  const createCourse = (educator, title, description, price, maxStudents) => {
    const courseId = nextCourseId++
    courses.set(courseId, {
      educator,
      title,
      description,
      price,
      maxStudents,
      currentStudents: 0,
      active: true,
    })
    return { ok: courseId }
  }
  
  const enrollInCourse = (student, courseId) => {
    const course = courses.get(courseId)
    if (!course) {
      return { error: "ERR_COURSE_NOT_FOUND" }
    }
    
    const enrollmentKey = `${courseId}-${student}`
    if (enrollments.has(enrollmentKey)) {
      return { error: "ERR_ALREADY_ENROLLED" }
    }
    
    if (course.currentStudents >= course.maxStudents) {
      return { error: "ERR_NOT_AUTHORIZED" }
    }
    
    enrollments.set(enrollmentKey, {
      enrolledDate: Date.now(),
      completed: false,
      progress: 0,
    })
    
    course.currentStudents++
    return { ok: true }
  }
  
  const updateProgress = (student, courseId, progress) => {
    const enrollmentKey = `${courseId}-${student}`
    const enrollment = enrollments.get(enrollmentKey)
    
    if (!enrollment) {
      return { error: "ERR_NOT_ENROLLED" }
    }
    
    enrollment.progress = progress
    enrollment.completed = progress >= 100
    return { ok: true }
  }
  
  const isEnrolled = (student, courseId) => {
    const enrollmentKey = `${courseId}-${student}`
    return enrollments.has(enrollmentKey)
  }
  
  it("should allow educators to create courses", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const result = createCourse(educator, "Introduction to Blockchain", "Learn blockchain fundamentals", 100, 50)
    
    expect(result.ok).toBe(1)
    expect(courses.has(1)).toBe(true)
    expect(courses.get(1).title).toBe("Introduction to Blockchain")
  })
  
  it("should allow students to enroll in courses", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    createCourse(educator, "Test Course", "Description", 100, 50)
    const result = enrollInCourse(student, 1)
    
    expect(result.ok).toBe(true)
    expect(isEnrolled(student, 1)).toBe(true)
    expect(courses.get(1).currentStudents).toBe(1)
  })
  
  it("should prevent duplicate enrollment", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    createCourse(educator, "Test Course", "Description", 100, 50)
    enrollInCourse(student, 1)
    
    const result = enrollInCourse(student, 1)
    expect(result.error).toBe("ERR_ALREADY_ENROLLED")
  })
  
  it("should track student progress", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    createCourse(educator, "Test Course", "Description", 100, 50)
    enrollInCourse(student, 1)
    
    const result = updateProgress(student, 1, 75)
    expect(result.ok).toBe(true)
    
    const enrollmentKey = `1-${student}`
    expect(enrollments.get(enrollmentKey).progress).toBe(75)
    expect(enrollments.get(enrollmentKey).completed).toBe(false)
  })
  
  it("should mark course as completed when progress reaches 100%", () => {
    const educator = "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ0F"
    const student = "SP2HTBVD3JG9C05J7HBJTHGR0GGW7KX17ECNWQZ1F"
    
    createCourse(educator, "Test Course", "Description", 100, 50)
    enrollInCourse(student, 1)
    updateProgress(student, 1, 100)
    
    const enrollmentKey = `1-${student}`
    expect(enrollments.get(enrollmentKey).completed).toBe(true)
  })
})
