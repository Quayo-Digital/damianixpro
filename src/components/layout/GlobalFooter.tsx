
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Globe, Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GlobalFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-12 px-6 bg-background border-t">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-green-600 to-green-400 text-white font-bold w-10 h-10 flex items-center justify-center rounded mr-2">D</div>
              <div className="text-2xl font-bold text-primary">DamianixPro</div>
            </div>
            <p className="text-muted-foreground mb-4">
              Revolutionizing property management in Nigeria with technology-driven solutions for landlords, tenants, and property managers.
            </p>
            <div className="flex space-x-4 mt-4">
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Solutions</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">For Landlords</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">For Tenants</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">For Property Managers</a></li>
              <li><Link to="/public/properties" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Browse Properties</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/blog" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Blog</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">Terms of Service</a></li>
              <li>
                <a href="mailto:contact@damianixpro.com" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  contact@damianixpro.com
                </a>
              </li>
              <li>
                <a href="https://damianixpro.com" className="text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  www.damianixpro.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground">
          <div className="flex items-center mb-4 md:mb-0">
            <Copyright className="h-4 w-4 mr-2" />
            <span>{currentYear} DamianixPro. All rights reserved.</span>
          </div>
          <div className="flex space-x-4">
            <Link to="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Privacy
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Terms
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
