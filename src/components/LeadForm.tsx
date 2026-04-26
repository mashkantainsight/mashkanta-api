'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { leadFormSchema, LeadFormValues, BANKS } from '@/lib/schemas';

type SubmitState = 'idle' | 'submitting' | 'error';

interface LeadFormProps {
  onSuccess?: (analysis: Record<string, unknown>) => void;
}

export function LeadForm({ onSuccess }: LeadFormProps = {}) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [statusMsg, setStatusMsg] = useState('קבל ניתוח משכנתא חינם');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { consent: false },
  });

  const consent = watch('consent');

  function handleFileChange(file: File | null) {
    if (!file) return;
    setSelectedFile(file);
    setValue('pdf', file, { shouldValidate: true });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  async function onSubmit(data: LeadFormValues) {
    setSubmitState('submitting');
    setErrorMsg('');
    setStatusMsg('מנתח את הדוח... ⏳');

    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target!.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(data.pdf);
      });

      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: b64 }),
      });

      if (resp.status === 429) {
        throw new Error('השרת עמוס כרגע. אנא המתן מספר דקות ונסה שוב.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = await resp.json();
      if (!resp.ok) {
        throw new Error(body?.details || body?.error || `שגיאת שרת ${resp.status}`);
      }
      const analysis = body;
      if (analysis.error) throw new Error(analysis.error);

      // Bank mismatch check
      if (analysis.bankName && data.bankName !== 'אחר') {
        const formBank = data.bankName.replace('בנק ', '').trim().toLowerCase();
        const pdfBank = analysis.bankName.replace('בנק ', '').trim().toLowerCase();
        if (!pdfBank.includes(formBank) && !formBank.includes(pdfBank)) {
          setSubmitState('error');
          setErrorMsg(`הבנק שנבחר (${data.bankName}) לא תואם לבנק בדוח (${analysis.bankName}). אנא בחר את הבנק הנכון.`);
          setStatusMsg('קבל ניתוח משכנתא חינם');
          return;
        }
      }

      analysis._user = {
        firstName: data.fullName.split(' ')[0],
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        bank: data.bankName,
      };
      analysis._timestamp = new Date().toISOString();
      if (onSuccess) {
        onSuccess(analysis as Record<string, unknown>);
      } else {
        localStorage.setItem('mtool_analysis', JSON.stringify(analysis));
        router.push('/results');
      }

    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err instanceof Error ? err.message : 'משהו השתבש. אנא נסה שנית.');
      setStatusMsg('קבל ניתוח משכנתא חינם');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" dir="rtl">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">שם מלא</Label>
        <Input id="fullName" placeholder="ישראל ישראלי" className={errors.fullName ? 'border-red-400' : ''} {...register('fullName')} />
        {errors.fullName && <FieldError message={errors.fullName.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">טלפון</Label>
        <Input id="phone" type="tel" placeholder="050-1234567" dir="ltr" className={`text-right ${errors.phone ? 'border-red-400' : ''}`} {...register('phone')} />
        {errors.phone && <FieldError message={errors.phone.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          אימייל <span className="text-gray-400 text-sm font-normal">(אופציונלי)</span>
        </Label>
        <Input id="email" type="email" placeholder="your@email.com" dir="ltr" className={`text-right ${errors.email ? 'border-red-400' : ''}`} {...register('email')} />
        {errors.email && <FieldError message={errors.email.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label>בנק</Label>
        <Select onValueChange={(v) => setValue('bankName', v as LeadFormValues['bankName'], { shouldValidate: true })}>
          <SelectTrigger className={`w-full ${errors.bankName ? 'border-red-400' : ''}`}>
            <SelectValue placeholder="בחר את הבנק שלך" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((bank) => (
              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bankName && <FieldError message={errors.bankName.message!} />}
      </div>

      <div className="space-y-1.5">
        <Label>קובץ אישור יתרות לסילוק (PDF)</Label>
        <div
          role="button" tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors
            ${dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-400 hover:bg-gray-50'}
            ${errors.pdf ? 'border-red-400' : ''}`}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 shrink-0" style={{ color: '#e8742b' }} />
              <div className="text-right">
                <p className="font-medium text-gray-800 text-sm">{selectedFile.name}</p>
                <p className="text-gray-400 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600 font-medium">גרור לכאן או לחץ להעלאה</p>
              <p className="text-gray-400 text-sm">PDF בלבד, עד 10MB</p>
            </div>
          )}
        </div>
        {errors.pdf && <FieldError message={errors.pdf.message!} />}
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="consent" className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-amber-700" {...register('consent')} />
        <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
          אני מאשר/ת שהמידע ישמש לניתוח המשכנתא שלי ויישמר בצורה מאובטחת. לא יועבר לצד שלישי.
        </Label>
      </div>
      {errors.consent && <FieldError message={errors.consent.message!} />}

      <Button
        type="submit"
        disabled={submitState === 'submitting' || !consent}
        className="w-full h-12 text-base disabled:opacity-50"
        style={{ backgroundColor: '#e8742b' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c85f1f')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e8742b')}
      >
        {submitState === 'submitting' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {statusMsg}
          </span>
        ) : (
          statusMsg
        )}
      </Button>

      {submitState === 'error' && errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-500 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />{message}
    </p>
  );
}
