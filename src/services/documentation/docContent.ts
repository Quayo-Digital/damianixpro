// Document content service

// Preview content for documentation selection
export const getDocPreviewContent = (role: string, guide: string, type: string) => {
  // Get proper display names for role and guide
  const roleDisplayName = getRoleDisplayName(role);
  const guideDisplayName = getGuideDisplayName(guide);

  // Generate preview based on type
  switch (type) {
    case 'overview':
      return getOverviewContent(roleDisplayName, guideDisplayName, guide);
    case 'sections':
      return { sections: getSectionsList(role, guide) };
    case 'toc':
      return { toc: getTableOfContents(role, guide) };
    default:
      return null;
  }
};

// Full document content for PDF generation
export const getDocumentContent = (role: string, guide: string) => {
  const roleDisplayName = getRoleDisplayName(role);
  const guideDisplayName = getGuideDisplayName(guide);

  // Get title and description
  const { title, description, topics } = getOverviewContent(
    roleDisplayName,
    guideDisplayName,
    guide
  );

  // Get TOC and sections
  const toc = getTableOfContents(role, guide);
  const sections = getDocumentSections(role, guide);

  return {
    title,
    description,
    topics,
    toc,
    sections,
  };
};

// Helper functions

// Get proper display names
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'owner':
      return 'Property Owner';
    case 'agent':
      return 'Property Agent';
    case 'tenant':
      return 'Tenant';
    case 'vendor':
      return 'Service Provider';
    default:
      return 'User';
  }
};

const getGuideDisplayName = (guide: string): string => {
  switch (guide) {
    case 'complete':
      return 'Complete Guide';
    case 'quickstart':
      return 'Quick Start Guide';
    case 'properties':
      return 'Property Management';
    case 'tenants':
      return 'Tenant Management';
    case 'finance':
      return 'Financial Management';
    case 'maintenance':
      return 'Maintenance Management';
    case 'documents':
      return 'Document Management';
    default:
      return 'Guide';
  }
};

// Get overview content
const getOverviewContent = (
  roleDisplayName: string,
  guideDisplayName: string,
  guideType: string
) => {
  const title = `${roleDisplayName} ${guideDisplayName}`;

  let description = `Comprehensive guide for ${roleDisplayName.toLowerCase()} users on how to effectively use the DamianixPro platform`;
  if (guideType !== 'complete') {
    description += ` with focus on ${guideDisplayName.toLowerCase()}`;
  }
  description += '.';

  // Generate topics based on role and guide
  let topics = [];

  // Common topics for all roles
  const commonTopics = [
    'Navigation and interface overview',
    'Account management and settings',
    'Notifications and alerts',
  ];

  // Role-specific topics
  const roleTopics: Record<string, string[]> = {
    admin: [
      'User management and permissions',
      'System configuration',
      'Database management',
      'Analytics and reporting',
    ],
    owner: [
      'Property portfolio management',
      'Financial oversight',
      'Tenant management',
      'Document storage',
    ],
    agent: [
      'Property listings management',
      'Tenant applications',
      'Maintenance coordination',
      'Owner reporting',
    ],
    tenant: [
      'Rent payments',
      'Maintenance requests',
      'Lease management',
      'Communication with property managers',
    ],
    vendor: [
      'Work order management',
      'Scheduling and availability',
      'Billing and payments',
      'Communication with property managers',
    ],
  };

  // Guide-specific topics
  const guideTopics: Record<string, string[]> = {
    properties: [
      'Adding and editing properties',
      'Property details and features',
      'Property media management',
      'Availability settings',
    ],
    tenants: ['Tenant onboarding', 'Lease management', 'Tenant communication', 'Tenant screening'],
    finance: [
      'Payment processing',
      'Financial reporting',
      'Invoice generation',
      'Accounting integration',
    ],
    maintenance: [
      'Creating maintenance requests',
      'Assigning vendors',
      'Tracking maintenance status',
      'Maintenance reporting',
    ],
    documents: [
      'Document upload and organization',
      'Document sharing and permissions',
      'Document templates',
      'E-signatures and approvals',
    ],
    quickstart: ['Account setup', 'Essential features', 'First steps guide', 'Common workflows'],
  };

  // Combine topics based on guide type
  if (guideType === 'complete') {
    topics = [...commonTopics, ...(roleTopics[roleDisplayName.toLowerCase()] || [])];
  } else {
    topics = [...commonTopics.slice(0, 1), ...(guideTopics[guideType] || [])];
  }

  return {
    title,
    description,
    topics,
  };
};

// Get sections list
const getSectionsList = (role: string, guide: string) => {
  const roleDisplayName = getRoleDisplayName(role);

  // Common sections for all guides
  const commonSections = [
    {
      title: 'Introduction',
      description: `Overview of DamianixPro for ${roleDisplayName} users`,
    },
    {
      title: 'Getting Started',
      description: 'Account setup, login, and basic navigation',
    },
  ];

  // Guide-specific sections
  const guideSections: Record<string, any[]> = {
    complete: [
      {
        title: 'Dashboard Overview',
        description: 'Understanding the main dashboard and its components',
      },
      {
        title: 'User Profile Management',
        description: 'Updating personal information and preferences',
      },
      {
        title: 'System Navigation',
        description: 'How to navigate through different sections of the platform',
      },
    ],
    properties: [
      {
        title: 'Property Management',
        description: 'Adding, editing, and managing property listings',
      },
      {
        title: 'Property Details',
        description: 'Managing property information, features, and attributes',
      },
      {
        title: 'Property Media',
        description: 'Uploading and managing property photos and videos',
      },
    ],
    tenants: [
      {
        title: 'Tenant Management',
        description: 'Adding and managing tenant information',
      },
      {
        title: 'Lease Agreements',
        description: 'Creating and managing lease documents',
      },
      {
        title: 'Tenant Communication',
        description: 'Tools for effective tenant communication',
      },
    ],
    finance: [
      {
        title: 'Financial Dashboard',
        description: 'Overview of financial metrics and reports',
      },
      {
        title: 'Payment Processing',
        description: 'Setting up and managing payment collection',
      },
      {
        title: 'Financial Reporting',
        description: 'Generating and analyzing financial reports',
      },
    ],
    maintenance: [
      {
        title: 'Maintenance Requests',
        description: 'Creating maintenance tickets',
      },
      {
        title: 'Vendor Management',
        description: 'Working with maintenance vendors and contractors',
      },
      {
        title: 'Maintenance Scheduling',
        description: 'Planning and scheduling maintenance activities',
      },
    ],
    documents: [
      {
        title: 'Document Management',
        description: 'Uploading and organizing documents',
      },
      {
        title: 'Document Templates',
        description: 'Using and creating document templates',
      },
      {
        title: 'Document Sharing',
        description: 'Sharing documents with other users',
      },
    ],
    quickstart: [
      {
        title: 'Quick Setup',
        description: 'Essential first steps to get started quickly',
      },
      {
        title: 'Core Features',
        description: 'Overview of the most important features',
      },
      {
        title: 'Common Tasks',
        description: 'Step-by-step guides for frequent tasks',
      },
    ],
  };

  // Role-specific sections to add
  const roleSections: Record<string, any[]> = {
    admin: [
      {
        title: 'User Management',
        description: 'Managing users, roles, and permissions',
      },
      {
        title: 'System Configuration',
        description: 'Platform settings and configuration options',
      },
      {
        title: 'Data Management',
        description: 'Managing and maintaining system data',
      },
    ],
    owner: [
      {
        title: 'Owner Dashboard',
        description: 'Understanding the owner-specific dashboard',
      },
      {
        title: 'Financial Overview',
        description: 'Tracking property performance and revenue',
      },
    ],
    agent: [
      {
        title: 'Agent Tools',
        description: 'Tools specific to property agents and managers',
      },
      {
        title: 'Client Management',
        description: 'Managing owner and tenant relationships',
      },
    ],
    tenant: [
      {
        title: 'Tenant Portal',
        description: 'Using the tenant portal effectively',
      },
      {
        title: 'Payment Options',
        description: 'Setting up and making rent payments',
      },
    ],
    vendor: [
      {
        title: 'Vendor Dashboard',
        description: 'Understanding the vendor-specific interface',
      },
      {
        title: 'Work Orders',
        description: 'Managing and completing work orders',
      },
    ],
  };

  // Combine sections based on guide type
  let sections = [...commonSections];

  if (guide === 'complete') {
    // For complete guide, include role-specific and general sections
    sections = [...sections, ...(roleSections[role] || []), ...guideSections['complete']];
  } else {
    // For specific guides, include relevant guide sections and minimal role context
    sections = [
      ...sections,
      ...(roleSections[role]?.slice(0, 1) || []),
      ...(guideSections[guide] || []),
    ];
  }

  // Add common conclusion section
  sections.push({
    title: 'Support and Resources',
    description: 'How to get help and find additional resources',
  });

  return sections;
};

// Get table of contents
const getTableOfContents = (role: string, guide: string) => {
  // Convert sections to TOC format
  const sections = getSectionsList(role, guide);

  return sections.map((section) => {
    // Generate sub-items based on section title
    let subItems = [];

    switch (section.title) {
      case 'Introduction':
        subItems = ['About DamianixPro', 'Purpose of this guide', 'Key features overview'];
        break;
      case 'Getting Started':
        subItems = ['Login and authentication', 'Navigation basics', 'User interface overview'];
        break;
      case 'Dashboard Overview':
        subItems = [
          'Dashboard components',
          'Key metrics and indicators',
          'Customizing your dashboard',
        ];
        break;
      case 'User Profile Management':
        subItems = [
          'Updating personal information',
          'Security settings',
          'Notification preferences',
        ];
        break;
      case 'Property Management':
        subItems = [
          'Adding new properties',
          'Editing property details',
          'Managing property status',
        ];
        break;
      case 'Tenant Management':
        subItems = [
          'Adding new tenants',
          'Tenant screening process',
          'Managing tenant information',
        ];
        break;
      case 'Financial Dashboard':
        subItems = ['Revenue tracking', 'Expense management', 'Financial reports'];
        break;
      case 'Maintenance Requests':
        subItems = [
          'Creating maintenance tickets',
          'Tracking request status',
          'Maintenance history',
        ];
        break;
      case 'Document Management':
        subItems = ['Uploading documents', 'Document categories', 'Document search and retrieval'];
        break;
      case 'User Management':
        subItems = ['Creating user accounts', 'Assigning user roles', 'Managing permissions'];
        break;
      case 'Support and Resources':
        subItems = ['Contacting support', 'Knowledge base access', 'Training resources'];
        break;
      default:
        // Generate generic subitems for other sections
        subItems = ['Overview and basics', 'Key functions and features', 'Tips and best practices'];
    }

    return {
      title: section.title,
      subItems,
    };
  });
};

// Get complete document sections with content
const getDocumentSections = (role: string, guide: string) => {
  const sections = getSectionsList(role, guide);
  const roleDisplayName = getRoleDisplayName(role);

  // Enhance sections with content
  return sections.map((section) => {
    let content = [];
    let steps = [];

    // Generate content based on section title
    switch (section.title) {
      case 'Introduction':
        content = [
          `Welcome to the DamianixPro platform ${roleDisplayName} guide. This documentation provides comprehensive information on how to use the system effectively in your role as a ${roleDisplayName.toLowerCase()}.`,
          `DamianixPro is a powerful property management system designed to simplify and streamline all aspects of property management, from tenant onboarding to financial tracking and maintenance management.`,
          `As a ${roleDisplayName.toLowerCase()}, you have specific permissions and capabilities within the system that this guide will help you understand and leverage.`,
        ];
        break;

      case 'Getting Started':
        content = [
          `To begin using DamianixPro, you'll need to log in using your credentials. If you don't have an account yet, please contact your system administrator.`,
          `Once logged in, you'll be directed to your personalized dashboard that displays key information relevant to your role as a ${roleDisplayName.toLowerCase()}.`,
        ];
        steps = [
          { text: `Navigate to the DamianixPro login page.` },
          { text: `Enter your email address and password.` },
          { text: `Click the "Sign In" button to access your account.` },
          {
            text: `If this is your first login, you may be prompted to complete your profile and set up preferences.`,
          },
        ];
        break;

      case 'Dashboard Overview':
        content = [
          `Your dashboard is the central hub for managing your activities within DamianixPro. It provides at-a-glance information about important metrics and quick access to common tasks.`,
          `The dashboard is customized based on your role as a ${roleDisplayName.toLowerCase()}, showing the most relevant information and actions for your responsibilities.`,
        ];
        break;

      case 'Property Management':
        content = [
          'The Property Management section provides owners and agents with all the tools required to add, view, and edit properties in the DamianixPro system.',
          'From this area, you can manage detailed records for each property—including its location, size, amenities, status, and associated financial and legal documents.',
          'Key functions include:',
          '',
          '• **Adding new properties:** Easily create new listings with all relevant details, images, and ownership information.',
          '• **Editing existing properties:** Quickly update property records as things change—such as tenant information, renovations, or listing status.',
          '• **Uploading property images and documents:** Store deeds, inspection reports, and media files for each property, ensuring all critical documentation is accessible.',
          '• **Assigning property managers or agents:** Designate responsibility for each property and ensure agents have access to the correct listings.',
          '',
          '### Pro Tips:',
          "- Use categories (e.g., 'Apartment', 'Single Family', 'Commercial') to organize your properties for easier searches.",
          '- Always keep property details up to date; this ensures accurate finance and maintenance tracking.',
          '- When uploading photos, use clear exterior and interior shots, and include floorplans if possible.',
          '',
          'Below is a detailed walkthrough of managing properties in DamianixPro:',
        ];
        steps = [
          { text: 'Go to the Properties section from the main dashboard menu.' },
          {
            text: "Click 'Add Property' to create a new property, or select an existing property to view details.",
          },
          {
            text: 'Fill in all required information including address, type, owner and agent details, and property features.',
          },
          {
            text: 'Upload property photos, floorplans, and legal documents in the attachments section.',
          },
          {
            text: 'After saving, check the property overview page for a summary and available actions (edit, assign, archive, etc.).',
          },
          {
            text: "To edit or update records, click 'Edit' on any property’s page and save your changes.",
          },
        ];
        break;

      case 'Tenant Management':
        content = [
          `The tenant management features help you keep track of all tenant information, including contact details, lease agreements, payment history, and maintenance requests.`,
          `You can easily onboard new tenants, review applications, and manage the entire tenant lifecycle from application to move-out.`,
        ];
        steps = [
          { text: `Access the Tenants section from the main navigation.` },
          { text: `Click "Add Tenant" to begin the tenant onboarding process.` },
          { text: `Enter tenant personal information and contact details.` },
          { text: `Associate the tenant with a specific property and unit.` },
          { text: `Set up lease terms and payment information.` },
          { text: `Save the tenant profile to complete the onboarding.` },
        ];
        break;

      case 'Financial Dashboard':
        content = [
          `The financial section provides a comprehensive overview of your property finances, including rent collection, expenses, and overall financial performance.`,
          `You can generate detailed reports, track payment history, and manage invoices all from one centralized location.`,
          `The system automatically calculates key financial metrics to help you understand your property's financial health at a glance.`,
        ];
        break;

      case 'Document Management':
        content = [
          `The document management system allows you to store, organize, and share important documents related to properties, tenants, vendors, and more.`,
          `Documents are securely stored in the cloud and can be accessed from anywhere with proper permissions. The system supports various file types including PDFs, images, and Microsoft Office documents.`,
          `You can create document templates for commonly used forms to save time and ensure consistency.`,
        ];
        steps = [
          { text: `Navigate to the Documents section in the main menu.` },
          { text: `Select a category or create a new folder to organize your documents.` },
          { text: `Click "Upload" to add new documents to the system.` },
          { text: `Set appropriate access permissions for each document.` },
          { text: `Use the search function to quickly find specific documents when needed.` },
        ];
        break;

      default:
        content = [
          `This section provides information about ${section.title.toLowerCase()} in the DamianixPro system.`,
          `As a ${roleDisplayName.toLowerCase()}, understanding these features will help you perform your role more effectively.`,
        ];
    }

    // Return enhanced section
    return {
      ...section,
      content,
      steps,
    };
  });
};
