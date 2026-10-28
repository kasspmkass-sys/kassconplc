import ResourceManager from './ResourceManager';

const categories = ['Mixed-Use', 'Residential', 'Commercial', 'Fuel Station', 'Infrastructure', 'Aviation', 'Industrial', 'Other'];

export function ProjectsAdmin() {
  return (
    <ResourceManager
      title="Projects"
      endpoint="projects"
      emptyItem={{
        title: '',
        client: '',
        category: 'Other',
        scope: '',
        location: '',
        contractValue: '',
        progress: 100,
        status: 'completed',
        year: '',
        description: '',
        featured: false,
        coverImage: '',
        images: '',
        order: 0,
        published: true,
        startDate: '',
        completionDate: '',
        lat: '',
        lng: '',
        majorQuantities: '',
        quantities: '',
        phases: [],
        mapLabel: '',
        mapRegion: 'Addis Ababa',
      }}
      fields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'client', label: 'Client' },
        { key: 'category', label: 'Category', type: 'select', options: categories },
        { key: 'status', label: 'Status', type: 'select', options: ['completed', 'ongoing'] },
        { key: 'scope', label: 'Scope', type: 'textarea', full: true },
        { key: 'location', label: 'Location' },
        { key: 'contractValue', label: 'Contract value (ETB)', type: 'number' },
        { key: 'progress', label: 'Progress %', type: 'number' },
        { key: 'year', label: 'Year' },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'coverImage', label: 'Cover image', type: 'file', full: true },
        { key: 'images', label: 'Gallery images', type: 'fileArray', full: true },
        { key: 'featured', label: 'Featured', type: 'checkbox' },
        { key: 'published', label: 'Published', type: 'checkbox' },
        /* Timing & location */
        { key: 'startDate', label: 'Start date', type: 'date' },
        { key: 'completionDate', label: 'Completion date', type: 'date' },
        { key: 'mapRegion', label: 'Map region (Ethiopia)', type: 'select', options: ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'SNNPR', 'Afar', 'Somali', 'Benishangul-Gumuz', 'Gambella', 'Harari', 'Dire Dawa', 'Other'] },
        { key: 'mapLabel', label: 'Map label (project name on map)' },
        { key: 'lat', label: 'Latitude', type: 'number' },
        { key: 'lng', label: 'Longitude', type: 'number' },
        /* Quantities + phases */
        { key: 'majorQuantities', label: 'Major quantities (bullets or comma-separated)', type: 'textarea', full: true },
        { key: 'quantities', label: 'Quantities summary', type: 'textarea', full: true },
        { key: 'phases', label: 'Phase images (Before / During / After)', type: 'fileArray', full: true },
      ]}
    />
  );
}

export function CertificatesAdmin() {
  return (
    <ResourceManager
      title="Certificates"
      endpoint="certificates"
      emptyItem={{
        name: '',
        issuer: '',
        number: '',
        issuedYear: '',
        validUntil: '',
        file: '',
        description: '',
        order: 0,
        published: true,
      }}
      fields={[
        { key: 'name', label: 'Certificate name', required: true },
        { key: 'issuer', label: 'Issuing body' },
        { key: 'number', label: 'Certificate number' },
        { key: 'issuedYear', label: 'Issued year' },
        { key: 'validUntil', label: 'Valid until', hint: 'e.g. Dec 2026' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'file', label: 'Certificate document', type: 'file', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function CareersAdmin() {
  return (
    <ResourceManager
      title="Careers"
      endpoint="careers"
      emptyItem={{
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        summary: '',
        description: '',
        requirements: '',
        deadline: '',
        order: 0,
        published: true,
        status: 'open',
      }}
      fields={[
        { key: 'title', label: 'Position title', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed'] },
        { key: 'type', label: 'Employment type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
        { key: 'department', label: 'Department' },
        { key: 'location', label: 'Location' },
        { key: 'deadline', label: 'Application deadline' },
        { key: 'summary', label: 'Summary', type: 'textarea', full: true },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'requirements', label: 'Requirements', type: 'tags', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function ServicesAdmin() {
  return (
    <ResourceManager
      title="Services"
      endpoint="services"
      emptyItem={{
        title: '', slug: '', summary: '', description: '', icon: 'building', features: '',
        capacityLabel: '', capacityText: '', process: [], qualityText: '', equipmentText: '',
        gallery: [], order: 0, featured: false, published: true, image: '',
      }}
      fields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'slug', label: 'Slug (URL-friendly)' },
        { key: 'icon', label: 'Icon key', type: 'select', options: ['building', 'fuel', 'steel', 'wood', 'quarry', 'management', 'crane', 'road', 'mixer', 'realestate'] },
        { key: 'summary', label: 'Summary', type: 'textarea', full: true },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'features', label: 'Features', type: 'tags', full: true },
        { key: 'image', label: 'Image', type: 'file', full: true },
        /* Detailed capability page — each block is optional */
        { key: 'capacityLabel', label: 'Capacity heading' },
        { key: 'capacityText', label: 'Capacity statement', type: 'textarea', full: true },
        { key: 'process', label: 'Process steps', type: 'subdocs', subkeys: ['title', 'desc'], full: true },
        { key: 'qualityText', label: 'Quality & compliance', type: 'textarea', full: true },
        { key: 'equipmentText', label: 'Equipment & resources', type: 'textarea', full: true },
        { key: 'gallery', label: 'Gallery images', type: 'fileArray', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'featured', label: 'Featured on home', type: 'checkbox' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function TeamAdmin() {
  return (
    <ResourceManager
      title="Team"
      endpoint="team"
      emptyItem={{ name: '', role: '', bio: '', photo: '', qualification: '', experience: '', order: 0, published: true }}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'role', label: 'Role' },
        { key: 'qualification', label: 'Qualification', hint: 'e.g. BSc in Civil Engineering, PE' },
        { key: 'experience', label: 'Experience', hint: 'e.g. 18 years in commercial construction' },
        { key: 'bio', label: 'Bio', type: 'textarea', full: true },
        { key: 'photo', label: 'Photo', type: 'file', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function ClientsAdmin() {
  return (
    <ResourceManager
      title="Clients"
      endpoint="clients"
      emptyItem={{ name: '', logo: '', website: '', order: 0, published: true }}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'website', label: 'Website' },
        { key: 'logo', label: 'Logo', type: 'file', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function AwardsAdmin() {
  return (
    <ResourceManager
      title="Awards"
      endpoint="awards"
      emptyItem={{ title: '', issuer: '', year: '', description: '', image: '', order: 0, published: true }}
      fields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'issuer', label: 'Issuer' },
        { key: 'year', label: 'Year' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'image', label: 'Image', type: 'file', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function TestimonialsAdmin() {
  return (
    <ResourceManager
      title="Testimonials"
      endpoint="testimonials"
      emptyItem={{
        quote: '',
        author: '',
        role: '',
        company: '',
        project: '',
        image: '',
        order: 0,
        published: true,
      }}
      fields={[
        { key: 'quote', label: 'Quote', type: 'textarea', required: true, full: true },
        { key: 'author', label: 'Author' },
        { key: 'role', label: 'Role' },
        { key: 'company', label: 'Company' },
        { key: 'project', label: 'Project' },
        { key: 'image', label: 'Letter / photo', type: 'file', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function MilestonesAdmin() {
  return (
    <ResourceManager
      title="Milestones"
      endpoint="milestones"
      emptyItem={{ year: '', title: '', description: '', order: 0, published: true }}
      fields={[
        { key: 'year', label: 'Year', required: true },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}

export function GalleryAdmin() {
  return (
    <ResourceManager
      title="Gallery"
      endpoint="gallery"
      emptyItem={{ title: '', category: '', image: '', order: 0, published: true }}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'image', label: 'Image', type: 'file', required: true, full: true },
        { key: 'order', label: 'Order', type: 'number' },
        { key: 'published', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}
