import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadForm } from '@/components/LeadForm';
import { TrendingDown, Shield, Clock, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3, title: 'ריבית אפקטיבית (IRR)', desc: 'כמה המשכנתא שלך עולה לך באמת' },
  { icon: TrendingDown, title: 'פילוח קרן/ריבית', desc: 'כמה כסף הולך לריבית לעומת קרן' },
  { icon: Clock, title: 'תחזית תשלומים', desc: 'גרף ההחזרים לאורך כל חיי ההלוואה' },
  { icon: Shield, title: 'ניתוח מסלולים', desc: 'פירוט כל מסלול — יתרה, ריבית, תאריך סיום' },
];

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">MortgageIQ</span>
          </div>
          <Badge variant="secondary" className="text-xs">בטא</Badge>
        </div>
      </header>

      <section className="flex-1 flex items-center py-12 px-4">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 order-2 lg:order-1">
            <div>
              <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                חינם לגמרי · ניתוח מיידי
              </Badge>
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                גלה כמה<br />
                <span className="text-blue-600">המשכנתא שלך</span><br />
                באמת עולה לך
              </h1>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed">
              העלה את דוח <strong className="text-gray-700">אישור יתרות לסילוק</strong> מהבנק וקבל ניתוח מקצועי תוך דקות — בלי לדבר עם אף אחד.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Shield className="h-3 w-3 shrink-0" />
              הקובץ מוצפן ומשמש לניתוח בלבד. לא נשמרים פרטים רגישים.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader className="pb-2 pt-6 px-6">
                <h2 className="text-xl font-bold text-gray-900">קבל ניתוח משכנתא חינם</h2>
                <p className="text-gray-500 text-sm">ממלאים, מעלים PDF ואנחנו עושים את השאר.</p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <LeadForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-4 px-6 text-center text-xs text-gray-400">
        © 2025 MortgageIQ · כל הזכויות שמורות · אין באמור ייעוץ פיננסי
      </footer>
    </main>
  );
}
