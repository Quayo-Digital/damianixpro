
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getDocumentContent } from './docContent';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePDF = async (role: string, guide: string): Promise<void> => {
  try {
    // Get document content based on role and guide type
    const content = getDocumentContent(role, guide);
    const roleName = getRoleDisplayName(role);
    const guideName = getGuideDisplayName(guide);
    
    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title page
    addTitlePage(pdf, content.title, content.description, roleName);
    
    // Add table of contents
    addTableOfContents(pdf, content.toc);
    
    // Add content sections
    addContentSections(pdf, content.sections);
    
    // Save the PDF
    const fileName = `DamianixPro-${roleName}-${guideName}-Guide.pdf`;
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
};

// Generate title page with logos, title and description
const addTitlePage = (pdf: jsPDF, title: string, description: string, role: string) => {
  // Add header
  pdf.setFontSize(24);
  pdf.setTextColor(41, 37, 36); // Gray-800
  pdf.text('DamianixPro', 105, 40, { align: 'center' });
  
  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, 105, 70, { align: 'center' });
  
  // Add role indicator
  pdf.setFontSize(16);
  pdf.setTextColor(79, 70, 229); // Indigo-600
  pdf.text(`For ${role} Users`, 105, 80, { align: 'center' });
  
  // Add description
  pdf.setFontSize(12);
  pdf.setTextColor(75, 85, 99); // Gray-600
  
  const splitDesc = pdf.splitTextToSize(description, 150);
  pdf.text(splitDesc, 105, 100, { align: 'center' });
  
  // Add footer
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('© DamianixPro ' + new Date().getFullYear(), 105, 280, { align: 'center' });
  
  // Add new page
  pdf.addPage();
};

// Generate table of contents
const addTableOfContents = (pdf: jsPDF, toc: any[]) => {
  pdf.setFontSize(18);
  pdf.setTextColor(0);
  pdf.text('Table of Contents', 20, 20);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0);
  
  let y = 35;
  toc.forEach((item, index) => {
    // Main section
    pdf.setFont(undefined, 'bold');
    pdf.text(`${index + 1}. ${item.title}`, 20, y);
    y += 7;
    
    // Subsections
    if (item.subItems && item.subItems.length > 0) {
      pdf.setFont(undefined, 'normal');
      item.subItems.forEach((subItem: string, subIndex: number) => {
        pdf.text(`    ${String.fromCharCode(97 + subIndex)}. ${subItem}`, 25, y);
        y += 7;
      });
    }
    
    y += 3; // Add spacing between main sections
  });
  
  pdf.addPage();
};

// Generate content sections
const addContentSections = (pdf: jsPDF, sections: any[]) => {
  let currentSection = 1;
  
  sections.forEach((section) => {
    // Section title
    pdf.setFontSize(16);
    pdf.setTextColor(0);
    pdf.setFont(undefined, 'bold');
    pdf.text(`${currentSection}. ${section.title}`, 20, 20);
    
    // Section description
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(60);
    const splitDesc = pdf.splitTextToSize(section.description, 170);
    pdf.text(splitDesc, 20, 30);
    
    let y = 30 + splitDesc.length * 7;
    
    // Section content
    if (section.content) {
      // Handle paragraphs
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      section.content.forEach((paragraph: string) => {
        const splitPara = pdf.splitTextToSize(paragraph, 170);
        
        // Check if we need a new page
        if (y + splitPara.length * 7 > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(splitPara, 20, y);
        y += splitPara.length * 7 + 5;
      });
    }
    
    // Handle steps if present
    if (section.steps && section.steps.length > 0) {
      // Add steps header
      if (y + 10 > 270) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Steps:', 20, y);
      y += 10;
      
      // Add steps
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      section.steps.forEach((step: any, index: number) => {
        const stepText = `${index + 1}. ${step.text}`;
        const splitStep = pdf.splitTextToSize(stepText, 160);
        
        // Check if we need a new page
        if (y + splitStep.length * 7 > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(splitStep, 20, y);
        y += splitStep.length * 7 + 5;
      });
    }
    
    // Add a new page for each section
    pdf.addPage();
    currentSection++;
  });
};

// Helper functions to get display names
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'owner': return 'Property Owner';
    case 'agent': return 'Property Agent';
    case 'tenant': return 'Tenant';
    case 'vendor': return 'Service Provider';
    default: return 'User';
  }
};

const getGuideDisplayName = (guide: string): string => {
  switch (guide) {
    case 'complete': return 'Complete';
    case 'quickstart': return 'QuickStart';
    case 'properties': return 'PropertyManagement';
    case 'tenants': return 'TenantManagement';
    case 'finance': return 'Financial';
    case 'maintenance': return 'Maintenance';
    case 'documents': return 'Document';
    default: return 'Guide';
  }
};
