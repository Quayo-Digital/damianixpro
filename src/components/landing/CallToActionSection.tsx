
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const CallToActionSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-green-400 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Property Experience?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of landlords, tenants, and property managers across Nigeria who are already benefiting from our platform.
        </p>
        <Link to="/auth">
          <Button size="lg" variant="secondary" className="text-lg px-8 bg-white text-green-600 hover:bg-gray-100">
            Get Started Now
          </Button>
        </Link>
      </div>
    </section>
  );
};
