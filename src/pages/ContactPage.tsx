import { Link } from 'react-router-dom';
import { ContactForm } from '@/components/contact/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, Building2, LogIn, User } from 'lucide-react';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { useAuthSession } from '@/contexts/auth';

export default function ContactPage() {
  const { user } = useAuthSession();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Public Navigation Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-r from-green-600 to-green-400 font-bold text-white">
                D
              </div>
              <span className="text-lg font-semibold">DamianixPro</span>
            </Link>

            <Link
              to="/contact"
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span>Contact</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/properties" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  <span>Login / Register</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Contact Our Sales Team</h1>
            <p className="text-muted-foreground">
              Get in touch with us for custom solutions, enterprise plans, or any questions about
              DamianixPro
            </p>
          </div>
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            {/* Contact Information Cards */}
            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Email Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">For general inquiries</p>
                <a
                  href="mailto:sales@damianixpro.com"
                  className="font-medium text-green-600 hover:text-green-700"
                >
                  sales@damianixpro.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Call Us</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">Business hours</p>
                <a
                  href="tel:+2348000000000"
                  className="font-medium text-green-600 hover:text-green-700"
                >
                  +234 800 000 0000
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Business Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM WAT
                  <br />
                  Saturday: 10:00 AM - 2:00 PM WAT
                  <br />
                  Sunday: Closed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-green-600" />
                <CardTitle>Damianix Systems Ltd</CardTitle>
              </div>
              <CardDescription>
                Promoter of DamianixPro | REDAN Member: NC/25/4428/DAM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="mb-1 font-medium">Office Address</p>
                  <p className="text-sm text-muted-foreground">Lagos, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <ContactForm />
        </div>
      </main>

      {/* Footer */}
      <GlobalFooter />
    </div>
  );
}
