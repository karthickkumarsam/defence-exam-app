const exams = [
  {
    id: "nda",
    name: "NDA",
    description: "National Defence Academy",
    notification: [
      { title: "Notification Release", date: 'December 10, 2025' },
      { title: "Application Begins", date: ' December 10, 2025' },
      { title: "Application Last Date", date: 'December 30, 2025 ' },
      { title: "Exam Date", date: 'April 12, 2026' }
    ],
    url: "public/exams/NDA/NDA_Previous_Question.pdf",
    syllabus: "public/exams/NDA/Syllabus.pdf",
    requirements: {
      age: "16.5-19 yrs",
      gender: "Male",
      education: "12th Pass / Equivalent",
      branch: ["Army", "Navy", "Air Force"]
    }
  },
  {
    id: "cds",
    name: "CDS",
    description: "Combined Defence Services",
    notification: [
      { title: "CDS 1 2026 Notification", date: 'December 10, 2025' },
      { title: "CDS 1 2026 Application period", date: 'December 12 to December 30, 2025' },
      { title: "CDS 1 2026 Exam", date: 'April 12, 2026' },
      { title: "CDS 2 2026 Notification", date: 'May 20, 2026' },
      { title: "CDS 2 2026 Application Period", date: 'June 9, 2026 (last date)' },
      { title: "CDS 2 2026 Exam", date: 'September 13, 2026' }
    ],
    url: "public/exams/CDS/CDS_Previous_Question.pdf",
    syllabus: "public/exams/CDS/Syllabus.pdf",
    requirements: {
      age: {
        army: "19–24 yrs",
        navy_air: "19–22 yrs"
      },
      gender: "Male / Female (Air & Naval Only for Male)",
      education: "Graduate (any stream) for IMA/Air Force Academy",
      branch: ["Army", "Navy", "Air Force"]
    }
  },
  {
    id: "afcat",
    name: "AFCAT",
    description: "Air Force Common Admission Test",
    notification: [
      { title: "For AFCAT 1 2026 (Courses starting July 2026)", date: 'Expected around December 2025.AFCAT 1 2026 Exam: Expected to beheld in February 2026.' },
      { title: "For AFCAT 2 2026 (Courses starting July 2026)", date: 'Expected in late May 2026.Detailed Notification: Expected around June 2026.' },
    ],
    url: "public/exams/AFCAT/AFCAT_Previous_Question.pdf",
    syllabus: "public/exams/AFCAT/Syllabus.pdf",
    requirements: {
      age: {
        flying: "20–24 yrs",
        ground_technical: "20–26 yrs",
        ground_admin: "20-26 yrs"
      },
      gender: "Male / Female",
      education: {
        flying: "Graduate (any stream)",
        ground_technical: "Engineering for Technical Branch",
        ground_admin: "Graduate (any stream)"
      },
      branch: ["Flying Branch", "Ground Duty (Technical)", "Ground Duty (Admin)"]
    }
  }
];

export default exams
