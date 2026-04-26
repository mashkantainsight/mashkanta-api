import type { Metadata } from 'next';
import { Assistant, Arimo } from 'next/font/google';
import './globals.css';

const assistant = Assistant({
  variable: '--font-assistant',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const arimo = Arimo({
  variable: '--font-arimo',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ניתוח משכנתא חינם | קבל תמונה מלאה בדקות',
  description: 'העלה את דוח אישור היתרות לסילוק וקבל ניתוח מקצועי של המשכנתא שלך — IRR, פילוח קרן/ריבית, תחזית תשלומים ועוד.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${arimo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {children}
      </body>
    </html>
  );
}
