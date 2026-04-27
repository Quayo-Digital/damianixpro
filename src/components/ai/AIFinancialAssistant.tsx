import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

const SUGGESTIONS = [
  'How much profit did I make this month?',
  'Analyze my spending',
  'Predict next month revenue',
  'Suggest cost savings',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIFinancialAssistant() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Please log in to use the financial assistant.',
          },
        ]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/ai/financial-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          date_from: getMonthStart(),
          date_to: getMonthEnd(),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I couldn't process that. Please try again.";

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please check your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMonthStart = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  };

  const getMonthEnd = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          AI Financial Assistant
        </CardTitle>
        <CardDescription>
          Ask about profit, spending, revenue predictions, or cost savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Chat area */}
        <div className="max-h-[320px] min-h-[180px] space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <MessageSquare className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">Ask a financial question</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setMessage(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-muted'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="e.g. How much profit did I make this month?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="max-h-[100px] min-h-[44px] resize-none"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
