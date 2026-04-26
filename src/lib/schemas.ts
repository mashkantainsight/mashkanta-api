import { z } from 'zod';

export const BANKS = [
  'בנק לאומי',
  'בנק הפועלים',
  'בנק מזרחי-טפחות',
  'בנק דיסקונט',
  'בנק ירושלים',
  'בנק הבינלאומי',
  'בנק מרכנתיל',
  'אחר',
] as const;

export const leadFormSchema = z.object({
  fullName: z.string().min(2, 'נא להזין שם מלא'),
  phone: z
    .string()
    .min(9, 'מספר טלפון לא תקין')
    .regex(/^0[2-9]\d{7,8}$/, 'מספר טלפון לא תקין'),
  email: z.string().email('כתובת מייל לא תקינה'),
  bankName: z.enum(BANKS, { error: 'נא לבחור בנק' }),
  pdf: z
    .instanceof(File, { message: 'נא להעלות קובץ PDF' })
    .refine((f) => f.type === 'application/pdf', 'הקובץ חייב להיות PDF')
    .refine((f) => f.size <= 10 * 1024 * 1024, 'גודל הקובץ מקסימלי 10MB'),
  consent: z.boolean().refine((v) => v === true, 'נדרשת הסכמה לתנאים'),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
