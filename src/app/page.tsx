import { LeadForm } from '@/components/LeadForm';

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#FEF3EC"/>
        <path d="M18 7L6 17H9V29H15V21H21V29H27V17H30L18 7Z" fill="#e8742b"/>
        <path d="M18 7L6 17H9V29H15V21H21V29H27V17H30L18 7Z" fill="url(#roof)" fillOpacity="0.15"/>
        <defs>
          <linearGradient id="roof" x1="18" y1="7" x2="18" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset="1" stopColor="#e8742b"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="font-bold text-gray-700 text-lg leading-tight">
        משכנתא<span className="text-[#e8742b]"> חדשה</span>
      </span>
    </span>
  );
}

const FEATURES = [
  {
    title: 'ריבית אפקטיבית (IRR)',
    desc: 'כמה המשכנתא שלך עולה לך באמת',
  },
  {
    title: 'פילוח קרן/ריבית',
    desc: 'כמה כסף הולך לריבית לעומת קרן',
  },
  {
    title: 'תחזית תשלומים',
    desc: 'גרף ההחזרים לאורך כל חיי ההלוואה',
  },
  {
    title: 'ניתוח מסלולים',
    desc: 'פירוט כל מסלול — יתרה, ריבית, תאריך סיום',
  },
];

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">בטא</span>
        </div>
      </header>

      <section className="flex-1 py-12 px-4" dir="rtl">
        <div className="max-w-[800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Copy */}
          <div className="space-y-6 order-2 lg:order-1 text-right">
            <div>
              <p className="text-sm font-semibold text-[#e8742b] mb-2">חינם לגמרי · ניתוח מיידי</p>
              <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
                גלה כמה<br />
                <span className="text-[#e8742b]">המשכנתא שלך</span><br />
                באמת עולה לך
              </h1>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed">
              העלה את דוח <strong className="text-gray-700">אישור יתרות לסילוק</strong> מהבנק וקבל ניתוח מקצועי תוך דקות — בלי לדבר עם אף אחד.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map(({ title, desc }) => (
                <div key={title} className="flex flex-col gap-1 items-start">
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              הקובץ מוצפן ומשמש לניתוח בלבד. לא נשמרים פרטים רגישים.
            </p>
          </div>

          {/* Form card */}
          <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">קבל ניתוח משכנתא חינם</h2>
            <p className="text-gray-500 text-sm mb-5">ממלאים, מעלים PDF ואנחנו עושים את השאר.</p>
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-4 px-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} משכנתא חדשה · אין באמור ייעוץ פיננסי
      </footer>
    </main>
  );
}
