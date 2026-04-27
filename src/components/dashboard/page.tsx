import { VoiceAssistantWidget } from '../ai/VoiceAssistantWidget';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">DamianixPro Dashboard</h1>

        <section>
          <VoiceAssistantWidget />
        </section>
      </div>
    </main>
  );
}
