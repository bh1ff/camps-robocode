import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPrimaryOrSecondary } from '@/lib/schools';

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');
    const format = searchParams.get('format');

    const where: Record<string, unknown> = { type: 'haf' };
    if (campId) where.campId = campId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        children: {
          include: {
            dayBookings: {
              include: { campDay: true },
            },
          },
        },
        camp: { include: { location: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (format === 'council') {
      return buildCouncilRegister(bookings);
    }

    return buildFullExport(bookings);
  } catch (error) {
    console.error('HAF export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

interface BookingWithChildren {
  id: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  address: string;
  postcode: string;
  hafCode: string | null;
  status: string;
  createdAt: Date;
  children: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    age: number;
    schoolName: string | null;
    schoolYear: string | null;
    hafCode: string | null;
    fsmEligible: boolean;
    ethnicity: string | null;
    gender: string | null;
    hasSEND: boolean;
    hasEHCP: boolean;
    ehcpDetails: string | null;
    hasAllergies: boolean;
    allergyDetails: string | null;
    photoPermission: boolean;
    dayBookings: {
      checkedIn: boolean;
      checkedOut: boolean;
      campDay: { dayLabel: string };
    }[];
  }[];
  camp: {
    name: string;
    location: { name: string; region: string } | null;
  };
}

/**
 * Council format matching "HAF attendance register V4.xlsx" Register sheet.
 * Columns: Unique code, First Name, Surname, DOB, Postcode of home address,
 * School attending, School academic year, Primary or Secondary,
 * FSM or Non-FSM eligible, SEND, Sessions attended, Sessions booked but not attended
 */
function buildCouncilRegister(bookings: BookingWithChildren[]) {
  const rows: string[] = [];

  rows.push([
    'Unique code',
    'First Name',
    'Surname',
    'DOB',
    'Postcode of home address',
    'School attending',
    'School academic year',
    'Primary or Secondary',
    'FSM or Non-FSM eligible',
    'SEND',
    'How many sessions have they attended',
    'How many sessions booked BUT did not attend?',
  ].join(','));

  let counter = 1;
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;

    for (const child of booking.children) {
      const totalBooked = child.dayBookings.length;
      const attended = child.dayBookings.filter((db) => db.checkedIn).length;
      const noShows = totalBooked - attended;

      const schoolYear = child.schoolYear || '';
      const primarySecondary = schoolYear ? getPrimaryOrSecondary(schoolYear) : '';

      const dob = child.dateOfBirth
        ? new Date(child.dateOfBirth).toLocaleDateString('en-GB')
        : '';

      const hafCode = child.hafCode || booking.hafCode || `RC-${String(counter).padStart(4, '0')}`;

      rows.push([
        csvEscape(hafCode),
        csvEscape(child.firstName),
        csvEscape(child.lastName),
        csvEscape(dob),
        csvEscape(booking.postcode),
        csvEscape(child.schoolName || ''),
        csvEscape(schoolYear),
        csvEscape(primarySecondary),
        csvEscape(child.fsmEligible ? 'FSM' : 'Non-FSM'),
        csvEscape(child.hasSEND ? 'SEND' : 'Non-SEND'),
        csvEscape(attended),
        csvEscape(noShows),
      ].join(','));

      counter++;
    }
  }

  const csv = rows.join('\n');
  const filename = `HAF_Register_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function buildFullExport(bookings: BookingWithChildren[]) {
  const rows: string[] = [];
  rows.push([
    'Booking ID',
    'Parent First Name',
    'Parent Last Name',
    'Parent Email',
    'Parent Phone',
    'Address',
    'Postcode',
    'HAF Code',
    'FSM Eligible',
    'Location',
    'Region',
    'Child First Name',
    'Child Last Name',
    'Child Age',
    'Date of Birth',
    'School',
    'School Year',
    'Primary/Secondary',
    'Ethnicity',
    'Gender',
    'SEND',
    'EHCP',
    'EHCP Details',
    'Allergies',
    'Allergy Details',
    'Photo Permission',
    'Days Booked',
    'Days Attended',
    'Status',
    'Booking Date',
  ].join(','));

  for (const booking of bookings) {
    for (const child of booking.children) {
      const daysBooked = child.dayBookings.map((db) => db.campDay.dayLabel).join('; ');
      const daysAttended = child.dayBookings
        .filter((db) => db.checkedIn)
        .map((db) => db.campDay.dayLabel)
        .join('; ');

      const schoolYear = child.schoolYear || '';
      const primarySecondary = schoolYear ? getPrimaryOrSecondary(schoolYear) : '';

      rows.push([
        csvEscape(booking.id.slice(0, 8)),
        csvEscape(booking.parentFirstName),
        csvEscape(booking.parentLastName),
        csvEscape(booking.parentEmail),
        csvEscape(booking.parentPhone),
        csvEscape(booking.address),
        csvEscape(booking.postcode),
        csvEscape(child.hafCode || booking.hafCode || ''),
        csvEscape(child.fsmEligible ? 'FSM' : 'Non-FSM'),
        csvEscape(booking.camp.location?.name || booking.camp.name),
        csvEscape(booking.camp.location?.region || ''),
        csvEscape(child.firstName),
        csvEscape(child.lastName),
        csvEscape(child.age),
        csvEscape(child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-GB') : ''),
        csvEscape(child.schoolName || ''),
        csvEscape(schoolYear),
        csvEscape(primarySecondary),
        csvEscape(child.ethnicity || ''),
        csvEscape(child.gender || ''),
        csvEscape(child.hasSEND ? 'Yes' : 'No'),
        csvEscape(child.hasEHCP ? 'Yes' : 'No'),
        csvEscape(child.ehcpDetails || ''),
        csvEscape(child.hasAllergies ? 'Yes' : 'No'),
        csvEscape(child.allergyDetails || ''),
        csvEscape(child.photoPermission ? 'Yes' : 'No'),
        csvEscape(daysBooked),
        csvEscape(daysAttended),
        csvEscape(booking.status),
        csvEscape(new Date(booking.createdAt).toLocaleDateString('en-GB')),
      ].join(','));
    }
  }

  const csv = rows.join('\n');
  const filename = `HAF_Export_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
