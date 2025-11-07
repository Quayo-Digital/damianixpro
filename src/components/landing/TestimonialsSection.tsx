
import React from "react";

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, role, avatarUrl }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
      <div className="flex text-green-500 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <p className="mb-4 italic">"{quote}"</p>
      <div className="flex items-center">
        <img 
          src={avatarUrl} 
          alt={`${name} testimonial`} 
          className="h-10 w-10 rounded-full mr-3"
        />
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from landlords, tenants, and property managers who have transformed their experience with DamianixPro.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Testimonial 
            quote="As a landlord with multiple properties, the automated rent collection has eliminated payment delays. I can now focus on property improvements instead of chasing payments."
            name="Oluwaseun Adeyemi"
            role="Landlord, Lagos"
            avatarUrl="https://i.pravatar.cc/150?img=1"
          />
          
          <Testimonial 
            quote="The 3D virtual tours saved me so much time. I found my perfect apartment without physically visiting dozens of properties. The maintenance system is also responsive."
            name="Ngozi Okafor"
            role="Tenant, Abuja"
            avatarUrl="https://i.pravatar.cc/150?img=5"
          />
          
          <Testimonial 
            quote="Managing 30+ properties was chaotic before DamianixPro. Now with the centralized dashboard, I've cut administrative work by 70% and improved tenant satisfaction."
            name="Chukwudi Eze"
            role="Property Manager, Port Harcourt"
            avatarUrl="https://i.pravatar.cc/150?img=3"
          />
        </div>
      </div>
    </section>
  );
};
