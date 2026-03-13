import { z } from 'zod';

export const parentSchema = z.object({
  parentFirstName: z.string().min(1, 'First name is required'),
  parentLastName: z.string().min(1, 'Last name is required'),
  parentEmail: z.string().email('Valid email is required'),
  parentPhone: z.string().min(5, 'Phone number is required'),
  address: z.string().min(3, 'Address is required'),
  postcode: z.string().min(3, 'Post code is required'),
});

export const childSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  age: z.number().min(4).max(18),
  schoolName: z.string().min(1, 'School name is required'),
  schoolYear: z.string().min(1, 'School year is required'),
  hafCode: z.string().optional(),
  fsmEligible: z.boolean().optional(),
  ethnicity: z.string().optional(),
  gender: z.string().optional(),
  hasSEND: z.boolean(),
  hasEHCP: z.boolean(),
  ehcpDetails: z.string().optional(),
  hasAllergies: z.boolean(),
  allergyDetails: z.string().optional(),
  photoPermission: z.boolean(),
});

const hafChildSchema = childSchema.extend({
  hafCode: z.string().min(1, 'HAF code is required'),
  fsmEligible: z.boolean(),
});

export const hafBookingSchema = z.object({
  campId: z.string().min(1),
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(5),
  address: z.string().min(3),
  postcode: z.string().min(3),
  children: z.array(hafChildSchema).min(1).max(3),
  selectedDays: z.array(z.string()).min(1, 'Select at least one day'),
});

export const paidBookingSchema = z.object({
  campId: z.string().min(1),
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(5),
  address: z.string().min(3),
  postcode: z.string().min(3),
  children: z.array(childSchema).min(1).max(3),
  selectedDays: z.array(z.string()).min(1, 'Select at least one day'),
});

export type ParentFormData = z.infer<typeof parentSchema>;
export type ChildFormData = z.infer<typeof childSchema>;
export type HafBookingData = z.infer<typeof hafBookingSchema>;
export type PaidBookingData = z.infer<typeof paidBookingSchema>;
