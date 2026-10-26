import React from "react";

export default function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://learnsphere-lms.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "LearnSphere LMS",
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description:
      "Enterprise-grade Learning Management System with automated grading, real-time WebRTC virtual classrooms, and cloud persistence.",
    parentOrganization: {
      "@type": "Organization",
      name: "KRAD TECH",
      email: "kradtech4@gmail.com",
    },
    sameAs: [
      "https://twitter.com/learnsphere",
      "https://github.com/daniy-al110/Learn-Sphere",
      "https://linkedin.com/company/learnsphere",
    ],
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LearnSphere LMS",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser, iOS, Android, macOS, Windows",
    url: baseUrl,
    offers: [
      {
        "@type": "Offer",
        name: "Free Community Plan",
        price: "0",
        priceCurrency: "USD",
        description: "1 Teacher, up to 10 Students, 1 active class, WebRTC live video hall, automated ledger.",
      },
      {
        "@type": "Offer",
        name: "Tuition Center Plan",
        price: "29",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "29",
          priceCurrency: "USD",
          unitText: "MONTH",
        },
        description: "Up to 5 Teachers, 60 Students, 8 active courses, custom tokens, and priority support.",
      },
      {
        "@type": "Offer",
        name: "Academy Pro Plan",
        price: "79",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "79",
          priceCurrency: "USD",
          unitText: "MONTH",
        },
        description: "Up to 25 Teachers, 350 Students, unlimited courses, priority WebRTC halls, and exportable transcripts.",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.92",
      ratingCount: "384",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Dynamic automated GPA recalculation on a 4.00 scale",
      "Integrated browser-based WebRTC video halls with screen-sharing",
      "Unified institutional email role detection (@student.lms.edu, @lms.edu)",
      "Secure temporary credential provisioning with bcrypt hashing",
      "Shareable class invite tokens with 1-click student self-enrollment",
      "Exportable gradebook transcripts and lecture schedules",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LearnSphere LMS",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/#curriculum?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Curriculum",
        item: `${baseUrl}/#curriculum`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Pricing Plans",
        item: `${baseUrl}/#pricing`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Join Class",
        item: `${baseUrl}/join`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Portal Login",
        item: `${baseUrl}/login`,
      },
    ],
  };

  const coursesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Course",
        position: 1,
        name: "Distributed Systems & Cloud Architecture",
        description: "Advanced distributed systems course covering Raft consensus, microservices, and event-driven architectures.",
        courseCode: "CS-401",
        provider: {
          "@type": "EducationalOrganization",
          name: "LearnSphere LMS",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: {
            "@type": "Person",
            name: "Dr. Alexander Smith",
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "142",
        },
      },
      {
        "@type": "Course",
        position: 2,
        name: "Deep Learning & Neural Networks",
        description: "Intermediate deep learning covering Transformers, PyTorch, and Computer Vision models.",
        courseCode: "AI-302",
        provider: {
          "@type": "EducationalOrganization",
          name: "LearnSphere LMS",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: {
            "@type": "Person",
            name: "Prof. Elena Rostova",
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          reviewCount: "198",
        },
      },
      {
        "@type": "Course",
        position: 3,
        name: "Cybersecurity & Cryptographic Protocols",
        description: "Specialist security curriculum featuring Zero-Knowledge Proofs, TLS 1.3, and threat modeling.",
        courseCode: "SEC-501",
        provider: {
          "@type": "EducationalOrganization",
          name: "LearnSphere LMS",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: {
            "@type": "Person",
            name: "Dr. Marcus Vance",
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5.0",
          reviewCount: "115",
        },
      },
      {
        "@type": "Course",
        position: 4,
        name: "Modern Full-Stack Web Architectures",
        description: "Foundational web architecture curriculum covering Next.js SSR, Supabase PostgreSQL, and scalable systems.",
        courseCode: "SWE-204",
        provider: {
          "@type": "EducationalOrganization",
          name: "LearnSphere LMS",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          instructor: {
            "@type": "Person",
            name: "Prof. Sarah Jenkins",
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "230",
        },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does the Unified Automatic Role Detection Login work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our backend parses your institutional email pattern (@student.lms.edu for students, @lms.edu for faculty, and admin accounts) or cross-references the secure PostgreSQL database, routing you automatically to your designated role dashboard.",
        },
      },
      {
        "@type": "Question",
        name: "How do students and faculty receive their initial credentials?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When an administrator provisions an account, our auto-credential engine creates an institutional identity, hashes a temporary password via bcrypt, and securely dispatches it directly to the user's personal email address via our automated SMTP service.",
        },
      },
      {
        "@type": "Question",
        name: "What if I forget my password or cannot access my account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply click 'Forgot Password?' on the login card. Provide your institutional email alongside your verified personal email. The system validates ownership and instantly delivers a new temporary login password to your personal inbox.",
        },
      },
      {
        "@type": "Question",
        name: "Do virtual lectures require installing third-party software like Zoom?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No downloads or external accounts are necessary. LearnSphere features integrated WebRTC video halls powered by Jitsi, enabling HD audio, video, chat, and screen-sharing right inside any modern browser.",
        },
      },
      {
        "@type": "Question",
        name: "How are grades, midterms, and cumulative GPAs calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The grading ledger dynamically weights attendance, online quizzes, and exam scores. When instructors input marks, the platform instantly recomputes GPAs on a standard 4.00 scale and updates the student transcript in real time.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
