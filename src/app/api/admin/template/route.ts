import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-admin-role');
  if (role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Robocode Camps';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Camp Import Template', {
      properties: { defaultColWidth: 18 },
    });

    // Define columns
    sheet.columns = [
      { header: 'Location', key: 'location', width: 22 },
      { header: 'Week Start Date', key: 'weekStart', width: 18 },
      { header: 'Child First Name', key: 'childFirst', width: 18 },
      { header: 'Child Last Name', key: 'childLast', width: 18 },
      { header: 'Age', key: 'age', width: 8 },
      { header: 'Allergies / Medical', key: 'allergies', width: 28 },
      { header: 'Parent First Name', key: 'parentFirst', width: 18 },
      { header: 'Parent Last Name', key: 'parentLast', width: 18 },
      { header: 'Parent Phone', key: 'parentPhone', width: 16 },
      { header: 'Parent Email', key: 'parentEmail', width: 26 },
      { header: 'Monday', key: 'monday', width: 10 },
      { header: 'Tuesday', key: 'tuesday', width: 10 },
      { header: 'Wednesday', key: 'wednesday', width: 10 },
      { header: 'Thursday', key: 'thursday', width: 10 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF003439' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add example rows
    const examples = [
      {
        location: 'Shirley',
        weekStart: '2026-03-30',
        childFirst: 'John',
        childLast: 'Smith',
        age: 8,
        allergies: 'Peanut allergy',
        parentFirst: 'Jane',
        parentLast: 'Smith',
        parentPhone: '07700123456',
        parentEmail: 'jane.smith@email.com',
        monday: 'Y',
        tuesday: 'Y',
        wednesday: 'N',
        thursday: 'Y',
      },
      {
        location: 'Shirley',
        weekStart: '2026-03-30',
        childFirst: 'Emma',
        childLast: 'Jones',
        age: 10,
        allergies: '',
        parentFirst: 'David',
        parentLast: 'Jones',
        parentPhone: '07700654321',
        parentEmail: 'david.jones@email.com',
        monday: 'Y',
        tuesday: 'Y',
        wednesday: 'Y',
        thursday: 'Y',
      },
    ];

    examples.forEach((ex) => {
      const row = sheet.addRow(ex);
      row.font = { color: { argb: 'FF999999' }, italic: true };
    });

    // Add data validation for day columns (Y/N)
    const dayColumns = ['K', 'L', 'M', 'N'];
    dayColumns.forEach((col) => {
      for (let row = 2; row <= 500; row++) {
        sheet.getCell(`${col}${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Y,N"'],
          showErrorMessage: true,
          errorTitle: 'Invalid',
          error: 'Please enter Y or N',
        };
      }
    });

    // Add instructions sheet
    const infoSheet = workbook.addWorksheet('Instructions');
    infoSheet.columns = [
      { header: '', key: 'info', width: 80 },
    ];

    const instructions = [
      'ROBOCODE CAMPS - IMPORT TEMPLATE INSTRUCTIONS',
      '',
      '1. Fill in the "Camp Import Template" sheet with your camp data.',
      '2. Delete the example rows (rows 2-3) before importing.',
      '3. Each row represents one child.',
      '',
      'COLUMN GUIDE:',
      '  Location         - The camp location name (e.g. Shirley, Boscombe)',
      '  Week Start Date  - The Monday of the camp week (YYYY-MM-DD format)',
      '  Child First Name - Child\'s first name',
      '  Child Last Name  - Child\'s last name',
      '  Age              - Child\'s age (number)',
      '  Allergies/Medical- Any allergies or medical conditions (leave blank if none)',
      '  Parent First Name- Parent/guardian first name',
      '  Parent Last Name - Parent/guardian last name',
      '  Parent Phone     - Contact phone number',
      '  Parent Email     - Contact email address',
      '  Monday           - Y if attending Monday, N if not',
      '  Tuesday          - Y if attending Tuesday, N if not',
      '  Wednesday        - Y if attending Wednesday, N if not',
      '  Thursday         - Y if attending Thursday, N if not',
      '',
      'NOTES:',
      '  - If a child attends multiple locations, add a separate row for each location.',
      '  - Day columns accept Y or N only.',
      '  - Age should be a whole number.',
      '  - All fields except Allergies are required.',
    ];

    instructions.forEach((line, i) => {
      const row = infoSheet.addRow({ info: line });
      if (i === 0) {
        row.font = { bold: true, size: 14, color: { argb: 'FF003439' } };
      } else if (line.startsWith('COLUMN GUIDE') || line.startsWith('NOTES')) {
        row.font = { bold: true, size: 11 };
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Robocode_Camp_Import_Template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
