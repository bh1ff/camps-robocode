import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import prisma from "@/lib/db";

const airForce = localFont({
  src: "../fonts/AirForce.otf",
  variable: "--font-display",
  display: "swap",
  weight: "700",
});

const myriadPro = localFont({
  src: "../fonts/MyriadPro-Regular.otf",
  variable: "--font-body",
  display: "swap",
  weight: "400",
});

async function getActiveSeason() {
  try {
    const season = await prisma.season.findFirst({
      where: { active: true },
      select: { title: true, startDate: true, endDate: true },
    });
    return season;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const season = await getActiveSeason();
  const seasonTitle = season?.title || "Holiday Tech Camp";
  const startDate = season?.startDate ? new Date(season.startDate).toISOString().slice(0, 10) : undefined;
  const endDate = season?.endDate ? new Date(season.endDate).toISOString().slice(0, 10) : undefined;

  return {
    title: `Robocode ${seasonTitle} | Ages 6–17 | Robotics, Coding & 3D Printing`,
    description: `Project-packed holiday tech camps in Solihull, Kingshurst, and Birmingham for ages 6–17. Robotics, electronics, game development, 3D printing, and mechanical engineering. Ofsted-registered. HAF-funded free places available. Book now for ${seasonTitle}.`,
    keywords: ["robotics classes Solihull", "coding camps Birmingham", "STEM holiday camps", "HAF holiday camps Solihull", "kids coding camp", "robotics for kids", `tech camp ${seasonTitle}`, "free holiday camps Solihull", "Robocode"],
    icons: {
      icon: "/mascot.png",
      apple: "/mascot.png",
    },
    openGraph: {
      title: `Robocode ${seasonTitle} | Ages 6–17`,
      description: "Build big in the holidays. Hands-on robotics, electronics, game development, and 3D printing for ages 6–17. Ofsted-registered. HAF-funded free places available.",
      images: ["/camp/rc-10.jpg"],
      type: "website",
      url: "https://camps.robocode.uk",
      siteName: "Robocode",
    },
    twitter: {
      card: "summary_large_image",
      title: `Robocode ${seasonTitle}`,
      description: "Project-packed holiday tech camps for ages 6–17. Robotics, electronics, game dev, 3D printing. Ofsted-registered. HAF-funded places available.",
      images: ["/camp/rc-10.jpg"],
    },
    alternates: {
      canonical: "https://camps.robocode.uk",
    },
    robots: {
      index: true,
      follow: true,
    },
    other: startDate && endDate ? { "event:start_date": startDate, "event:end_date": endDate } : undefined,
  };
}

async function JsonLd() {
  const season = await getActiveSeason();
  const seasonTitle = season?.title || "Holiday Tech Camp";
  const startDate = season?.startDate ? new Date(season.startDate).toISOString().slice(0, 10) : "2026-04-14";
  const endDate = season?.endDate ? new Date(season.endDate).toISOString().slice(0, 10) : "2026-04-25";

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `Robocode ${seasonTitle}`,
    "description": "Project-packed holiday tech camps for ages 6–17. Robotics, electronics, game development, 3D printing, and mechanical engineering. HAF-funded free places available.",
    "startDate": startDate,
    "endDate": endDate,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "image": "https://camps.robocode.uk/camp/rc-10.jpg",
    "organizer": {
      "@type": "EducationalOrganization",
      "name": "Robocode",
      "url": "https://robocode.uk",
      "telephone": "+44-121-661-9222",
      "email": "info@robocode.uk"
    },
    "location": [
      {
        "@type": "Place",
        "name": "Robocode Shirley Centre",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "The Exchange, 26 Haslucks Green Road",
          "addressLocality": "Shirley",
          "addressRegion": "Solihull",
          "postalCode": "B90 2EL",
          "addressCountry": "GB"
        }
      },
      {
        "@type": "Place",
        "name": "Tudor Grange Academy Kingshurst",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Cooks Lane, Fordbridge",
          "addressLocality": "Birmingham",
          "postalCode": "B37 6NU",
          "addressCountry": "GB"
        }
      },
      {
        "@type": "Place",
        "name": "Birmingham City University",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "4 Cardigan Street",
          "addressLocality": "Birmingham",
          "postalCode": "B4 7BD",
          "addressCountry": "GB"
        }
      }
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "HAF-Funded Place (Free)",
        "price": "0",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "description": "Free places for children eligible for free school meals with a valid HAF code.",
        "url": "https://camps.robocode.uk/book/haf"
      },
      {
        "@type": "Offer",
        "name": "Paid Camp Day",
        "price": "25",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "description": "Paid camp places from £25 per day. Multi-day packages available.",
        "url": "https://camps.robocode.uk/book/paid"
      }
    ],
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "suggestedMinAge": 6,
      "suggestedMaxAge": 17
    },
    "typicalAgeRange": "6-17"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body className={`${airForce.variable} ${myriadPro.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
