import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is',
    question: 'What is DamianixPro?',
    answer:
      'DamianixPro is an all-in-one property operations platform for Nigeria: listings (long-term and short-lets), tenants, rent collection, maintenance tickets, CRM for agents, accounting insights, and AI-assisted workflows — so owners, agents, and managers run fewer spreadsheets and fewer WhatsApp threads.',
  },
  {
    id: 'who-for',
    question: 'Who is it built for?',
    answer:
      'Property owners and landlords, agents and portfolio managers, facility teams, accountants, and tenants. Role-based access keeps each person in their lane while sharing one source of truth for properties, leases, and payments.',
  },
  {
    id: 'payments',
    question: 'How do rent and subscriptions get paid?',
    answer:
      'Subscriptions and many rent flows are settled in Naira through Flutterwave after you sign in. Your organisation chooses plans that match team size and modules; tenants can receive payment links alongside reminders where your setup enables it.',
  },
  {
    id: 'free-tier',
    question: 'Is there a free tier?',
    answer:
      'The product is paid — there is no permanent free tier on the platform. You can explore public listings and marketing pages without an account; full dashboards, billing, and automation require an active subscription.',
  },
  {
    id: 'ai',
    question: 'How do AI features work?',
    answer:
      'AI runs where we wire models and automation: listing copy, voice and WhatsApp assistants, routing rent reminders, matching, forecasting, and maintenance insights. Some capabilities need provider keys configured on your deployment; others use built-in analytics. When AI is unavailable, the app falls back to templates and manual flows where designed.',
  },
  {
    id: 'data-security',
    question: 'Where is my data stored?',
    answer:
      'Application data lives in Supabase (PostgreSQL) with row-level security tuned per role. Secrets and keys belong in environment configuration — never committed to git. Follow your organisation’s backup and access policies for production.',
  },
  {
    id: 'shortlets',
    question: 'Do you support short-lets as well as yearly rent?',
    answer:
      'Yes. You can operate both short-let bookings and traditional leases from the same workspace, with routing and dashboards adapted to how you run each line of business.',
  },
  {
    id: 'support',
    question: 'How do I get help?',
    answer:
      'Signed-in users can use in-app help and notifications. For sales or partnership questions, use the contact options linked from the site footer or your onboarding materials.',
  },
];

export function LandingFaqSection() {
  return (
    <section id="faq" className="scroll-mt-24">
      <div className="glass-panel overflow-hidden rounded-3xl p-6 md:p-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
            FAQ
          </div>
          <h2 className="premium-title text-2xl text-foreground md:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Straight answers about the platform, billing, AI, and how teams use DamianixPro in
            Nigeria.
          </p>
        </div>

        <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-border px-1">
              <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline [&[data-state=open]]:text-primary">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Still unsure?{' '}
          <a
            href="#pricing"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Compare plans
          </a>{' '}
          or{' '}
          <Link
            to="/auth?tab=register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            create an account
          </Link>{' '}
          to see the product.
        </p>
      </div>
    </section>
  );
}
