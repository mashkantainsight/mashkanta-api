import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'ניתוח משכנתא חינם | קבל תמונה מלאה בדקות',
  description: 'העלה את דוח אישור היתרות לסילוק וקבל ניתוח מקצועי של המשכנתא שלך.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-heebo)] bg-gray-50">
        {children}
      </body>
    </html>
  );
}
