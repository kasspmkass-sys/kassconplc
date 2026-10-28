import mongoose from 'mongoose';

const labelPair = { type: { title: String, description: String } };
const linkItem = { type: [{ to: String, label: String }] };
const textArray = { type: [String] };
const subDocs = (fields, def) => ({ type: [fields], default: def || [] });

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Kassa & Sons Construction PLC' },
    tagline: { type: String, default: 'The Result Of Unity' },
    headline: { type: String, default: 'Building the Future with Quality & Integrity' },
    aboutShort: String,
    aboutLong: String,
    mission: String,
    vision: String,
    values: [{ title: String, description: String }],
    specializations: [{ title: String, description: String }],
    historicalContent: [{ title: String, description: String }],
    foundingStory: String,
    historicalBackground: String,
    phone: String,
    phones: [String],
    email: String,
    emails: [String],
    website: String,
    address: String,
    legetafoAddress: String,
    poBox: String,
    workingHours: String,
    capital: String,
    grade: { type: String, default: 'Grade-1 General Contractor' },
    foundedYear: { type: String, default: '1980' },
    yearsExperience: { type: String, default: '46+' },
    projectCount: { type: String, default: '37+' },
    specialists: { type: String, default: '108' },
    heroImage: String,
    whoWeAreImage: String,
    heroSideImage: String,
    heroSlides: [String],
    heroEyebrow: String,
    heroSupporting: String,
    ownersKicker: String,
    ownersTitle: String,
    hero: {
      type: {
        slideInterval: { type: Number, default: 5000 },
        primaryCtaLabel: String,
        secondaryCtaLabel: String,
        defaultSlideAlt: String,
      },
    },
    ownerName: { type: String, default: 'Ato Kassa G/Tsadik' },
    ownerTitle: { type: String, default: 'Founder & Chairman' },
    ownerBio: String,
    ownerImage: String,
    ownerQuote: String,
    homeVideoUrl: String,
    homeVideoPoster: String,
    homeVideoTitle: String,
    homeVideoSubtitle: String,
    logo: String,
    logoSize: { type: Number, default: 44 },
    header: {
      name: { type: String, default: 'Kassa & Sons' },
      subtitle: { type: String, default: 'Construction PLC' },
      quoteLabel: String,
      profileLabel: String,
      showPhone: { type: Boolean, default: true },
      showProfile: { type: Boolean, default: true },
      showQuote: { type: Boolean, default: true },
      aboutMenu: subDocs({ label: String, to: String }, []),
      projectsMenu: subDocs({ label: String, to: String }, []),
      capabilitiesMenu: subDocs({ label: String, to: String }, []),
      navLinks: {
        type: [{ to: String, label: String }],
        default: [
          { to: '/', label: 'Home' },
          { to: '/about', label: 'About' },
          { to: '/services', label: 'Services' },
          { to: '/projects', label: 'Projects' },
          { to: '/capabilities', label: 'Capabilities' },
          { to: '/contact', label: 'Contact' },
        ],
      },
    },
    footer: {
      aboutText: { type: String, default: '' },
      showSocial: { type: Boolean, default: true },
      showExplore: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      showOperations: { type: Boolean, default: true },
        showAdminLink: { type: Boolean, default: true },
        // Compliance certificate list in the footer (reads /certificates/public)
        showCertifications: { type: Boolean, default: true },
        copyright: { type: String, default: '' },
        exploreTitle: String,
        servicesTitle: String,
        contactTitle: String,
        servicesCta: String,
        ctaHeading: String,
        certificationsTitle: String,
      exploreLinks: subDocs({ to: String, label: String }, []),
      // Capability column links. `servicesTitle` doubles as this column's
      // heading, so only the link list needed adding.
      capabilityLinks: subDocs({ to: String, label: String }, []),
    },
    mapEmbed: String,
    social: {
      facebook: String,
      linkedin: String,
      youtube: String,
    },
    home: {
      stats: {
        type: [
          {
            value: String,
            label: String,
            descriptor: String,
          },
        ],
        default: [
          { value: '46+', label: 'Years of excellence',    descriptor: '' },
          { value: '37+', label: 'Completed projects',     descriptor: '' },
          { value: '108', label: 'Professional staff',     descriptor: '' },
          { value: 'Grade 1', label: 'Contractor licence', descriptor: '' },
        ],
      },
      services: {
        type: {
          kicker: String,
          title: String,
          subtitle: String,
          image: String,
          imageAlt: String,
          cardCtaLabel: String,
          ctaLabel: String,
        },
        default: {
          kicker: 'What we build',
          title: 'Integrated construction services',
          subtitle: 'From foundations to fuel stations - one contractor for complex, multi-discipline delivery.',
        },
      },
      projects: {
        type: {
          kicker: String,
          title: String,
          subtitle: String,
          image: String,
          imageAlt: String,
          ctaLabel: String,
        },
        default: {
          kicker: 'Portfolio',
          title: 'Featured projects',
          subtitle: 'Landmark mixed-use, energy and infrastructure works across Ethiopia.',
        },
      },
      clients: {
        type: {
          label: String,
        },
        default: {
          label: 'Trusted by leading organisations',
        },
      },
      testimonials: {
        type: {
          kicker: String,
          title: String,
          subtitle: String,
        },
        default: {
          kicker: 'Proof',
          title: 'What clients say',
          subtitle: 'Voices from banks, energy operators, developers and consultants who trusted Kascon on live projects.',
        },
      },
      cta: {
        type: {
          title: String,
          text: String,
          buttonText: String,
        },
        default: {
          title: 'Ready to build with Ethiopia\'s trusted Grade-1 partner?',
          text: 'Tell us about your project - our team will respond with capability, programme and next steps.',
          buttonText: 'Contact Us',
        },
      },
      about: {
        type: {
          kicker: String,
          title: String,
          description: String,
          primaryCtaLabel: String,
          secondaryCtaLabel: String,
          image: String,
          imageAlt: String,
          cautionText: String,
          cautionAuthor: String,
        },
      },
      careers: {
        type: {
          kicker: String,
          title: String,
          text: String,
          ctaLabel: String,
          image: String,
          imageAlt: String,
          caption: String,
          pillars: subDocs({ title: String, description: String }, []),
        },
      },
      safety: {
        type: {
          kicker: String,
          title: String,
          lead: String,
          ctaLabel: String,
          image: String,
          imageAlt: String,
          caption: String,
          badge: String,
          commitments: textArray,
        },
      },
      locations: {
        type: {
          kicker: String,
          title: String,
          text: String,
          image: String,
          imageAlt: String,
          facilitiesEyebrow: String,
          primaryCtaLabel: String,
          secondaryCtaLabel: String,
          facilities: subDocs({ tag: String, city: String, address: String }, []),
        },
      },
      finalCta: {
        type: {
          kicker: String,
          title: String,
          text: String,
          buttonText: String,
          imageAlt: String,
        },
      },
      // ── Capacity & Equipment section ────────────────────────────────
      capacity: {
        type: {
          kicker: String,
          title: String,
          subtitle: String,
          ctaLabel: String,
          image: String,
          imageAlt: String,
        },
        default: {
          kicker:   'Production capacity',
          title:    'Self-performed plant, equipment & fleet.',
          subtitle: 'KASCON owns and operates its own batching plant, stone crusher, steel workshop, transit mixer fleet and heavy equipment — enabling direct delivery control.',
          ctaLabel: 'View capabilities',
        },
      },
      // ── Owned fleet sub-block (inside Production Capacity) ───────────
      // The homepage merges capacity + fleet into one section, so this block
      // carries only the fleet sub-heading. The machines themselves come from
      // the Equipment collection (GET /equipment/public) — nothing duplicated.
      equipment: {
        type: {
          kicker: String,
          subtitle: String,
          ctaLabel: String,
          image: String,
          imageAlt: String,
        },
        default: {
          kicker:   'Our equipment',
          subtitle: 'KASCON operates its own earthmoving, transport, concrete, lifting and crushing equipment - maintained in our in-house auto shop rather than hired in.',
          ctaLabel: 'View equipment gallery',
        },
      },
      // ── Latest Updates / News section ───────────────────────────────
      latestUpdates: {
        type: {
          kicker:     String,
          title:      String,
          subtitle:   String,
          ctaLabel:   String,
          emptyState: String,
        },
        default: {
          kicker:     'Latest updates',
          title:      'News, milestones & announcements.',
          subtitle:   'Project completions, new equipment, company milestones and construction updates from across KASCON operations.',
          ctaLabel:   'View all updates',
          emptyState: 'Updates will appear here once published.',
        },
      },
    },
    about: {
      hero: {
        type: {
          kicker: String,
          title: String,
          image: String,
        },
        default: {
          kicker: 'About Kascon',
          title: 'Building Ethiopia with integrity since 1980.',
        },
      },
      company: {
        type: {
          kicker: String,
          title: String,
          companyCta1: String,
          companyCta2: String,
          aboutImage: String,
        },
        default: {
          kicker: 'Our company',
          title: 'Multidisciplinary Grade-1 contractor',
        },
      },
      values: {
        type: {
          kicker: String,
          title: String,
          valuesTitle: String,
        },
        default: {
          kicker: 'Values',
          title: 'What guides every project',
        },
      },
      timeline: {
        type: {
          kicker: String,
          title: String,
          description: String,
        },
        default: {
          kicker: 'Timeline',
          title: 'History & milestones',
        },
      },
      leadership: {
        type: {
          kicker: String,
          title: String,
          leadershipTitle: String,
          teamLabel: String,
        },
        default: {
          kicker: 'Leadership',
          title: 'Governance & key personnel',
        },
      },
      awards: {
        type: {
          kicker: String,
          title: String,
        },
        default: {
          kicker: 'Recognition',
          title: 'Awards & excellence',
        },
      },
      specializations: {
        type: {
          kicker: String,
          title: String,
          positionPoints: subDocs(labelPair.type, []),
          keyFactLabels: textArray,
        },
        default: {
          kicker: 'Specialization',
          title: 'Areas of specialization',
        },
      },
      founder: {
        type: {
          kicker: String,
          title: String,
        },
        default: {
          kicker: 'Founder',
          title: 'Founder & historical background',
        },
      },
      approach: {
        type: {
          kicker: String,
          title: String,
          items: subDocs({ title: String, description: String }, []),
        },
      },
      capabilities: {
        type: {
          kicker: String,
          ctaLabel: String,
          items: subDocs({ title: String, description: String }, []),
        },
      },
      digital: {
        type: {
          kicker: String,
          title: String,
          lead: String,
          caption: String,
          image: String,
          points: textArray,
        },
      },
      erp: {
        type: {
          kicker: String,
          title: String,
          lead: String,
          flowLabel: String,
          modules: textArray,
          flow: subDocs({ title: String, description: String }, []),
        },
      },
      experience: {
        type: {
          kicker: String,
          title: String,
          deliverablesLabel: String,
          allCapabilitiesCta: String,
        },
      },
      testimonials: {
        type: {
          kicker: String,
          title: String,
        },
      },
      cta: {
        type: {
          kicker: String,
          title: String,
          text: String,
          primaryLabel: String,
          secondaryLabel: String,
        },
      },
    },
    servicesPage: {
      type: {
        kicker: String,
        title: String,
        lead: String,
        emptyState: String,
        detail: {
          type: {
            notFoundTitle: String,
            allServicesLabel: String,
            overviewLabel: String,
            noDescription: String,
            capabilitiesLabel: String,
            processLabel: String,
            qualityLabel: String,
            equipmentLabel: String,
            galleryLabel: String,
            enquiryCta: String,
          },
        },
      },
    },
    projectsPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        searchPlaceholder: String,
        emptyState: String,
        /* Interactive project map (§9) */
        mapKicker: String,
        mapTitle: String,
        mapSubtitle: String,
        mapEmptyNote: String,
        registeredWorkLabel: String,
        featuredLabel: String,
        viewLabel: String,
        statLabels: textArray,
        groupLabels: subDocs({ category: String, label: String }, []),
        cardLabels: {
          type: {
            client: String,
            location: String,
            contract: String,
          },
        },
        detail: {
          type: {
            notFoundTitle: String,
            backLabel: String,
            overviewLabel: String,
            scopeLabel: String,
            progressLabel: String,
            galleryLabel: String,
            informationLabel: String,
            factLabels: {
              type: {
                client: String,
                location: String,
                year: String,
                category: String,
                status: String,
                contract: String,
              },
            },
            enquiriesLabel: String,
            relatedKicker: String,
            relatedTitle: String,
            relatedViewAll: String,
            registeredWorkLabel: String,
            ctaKicker: String,
            ctaTitle: String,
            ctaText: String,
            ctaPrimary: String,
            ctaSecondary: String,
          },
        },
      },
    },
    capabilitiesPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        whyKicker: String,
        whyTitle: String,
        /* Each unit is a capability card. `specs` are the short bullet points
           under the description and `icon` pins the card icon, so reordering
           units in the admin never reshuffles the icons. `anchor` is the stable
           DOM id used by cross-page deep links (/capabilities#anchor) in the
           Navbar and Footer, so renaming a title never breaks those links. */
        units: subDocs(
          {
            title: String,
            description: String,
            specs: textArray,
            icon: { type: String, enum: ['factory', 'warehouse', 'wrench', 'truck'] },
            anchor: String,
          },
          []
        ),
        hseq: subDocs(labelPair.type, []),
      },
    },
    contactPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        headOfficeLabel: String,
        operationsLabel: String,
        operationsList: String,
        allLinesLabel: String,
        formKicker: String,
        formTitle: String,
        submitLabel: String,
        sendingLabel: String,
        successToast: String,
        failToast: String,
        formLabels: {
          type: {
            name: String,
            email: String,
            phone: String,
            subject: String,
            message: String,
          },
        },
      },
    },
    careersPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        image: String,
        alt: String,
        emptyState: String,
          applyLabel: String,
          /* Open roles block copy */
          openRolesKicker: String,
          openRolesTitle: String,
          /* Training & development block */
          trainingKicker: String,
          trainingTitle: String,
          trainingLead: String,
          trainingItems: subDocs({ title: String, desc: String }, []),
          /* CTA block for careers page */
          ctaKicker: String,
          ctaTitle: String,
          ctaText: String,
          ctaPrimary: String,
          ctaSecondary: String,
        },
      },
    whereWeWorkPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        image: String,
        alt: String,
        /* Coverage map copy */
        mapKicker: String,
        mapTitle: String,
        mapSubtitle: String,
      },
    },
    notFoundPage: {
      type: {
        title: String,
        body: String,
        ctaLabel: String,
      },
    },
    // ── New pages added in the frontend upgrade ──────────────────────────────

    hseqPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        safetyKicker: String,
        safetyTitle: String,
        safetyLead: String,
        safetyCommitments: subDocs({ title: String, desc: String }, []),
        qualityKicker: String,
        qualityTitle: String,
        qualitySteps: subDocs({ number: String, title: String, desc: String }, []),
        registrationsKicker: String,
        registrationsTitle: String,
        registrations: subDocs({ label: String, value: String }, []),
        /* Licences & certificates block — cards come from GET /certificates/public */
        certificatesKicker: String,
        certificatesTitle: String,
        certificatesLead: String,
        documentsKicker: String,
        documentsTitle: String,
        ctaTitle: String,
        ctaText: String,
        image: String,
        imageAlt: String,
      },
    },

    readyMixPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        plantKicker: String,
        plantTitle: String,
        plantFacts: subDocs({ label: String, value: String }, []),
        /* Production capacity + supply record. Optional: only publish a figure
           once it is confirmed, so the block can be left empty entirely. */
        capacityKicker: String,
        capacityTitle: String,
        capacityFacts: subDocs({ label: String, value: String }, []),
        concreteGrades: textArray,
        qualityKicker: String,
        qualityTitle: String,
        qualitySteps: textArray,
        formKicker: String,
        formTitle: String,
        formLead: String,
        successToast: String,
        failToast: String,
        image: String,
        imageAlt: String,
      },
    },

    aggregatePage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        plantKicker: String,
        plantTitle: String,
        plantFacts: subDocs({ label: String, value: String }, []),
        /* Crushing plant output + product descriptors. Optional. */
        capacityKicker: String,
        capacityTitle: String,
        capacityFacts: subDocs({ label: String, value: String }, []),
        products: subDocs({ title: String, desc: String }, []),
        aggregateSizes: textArray,
        formKicker: String,
        formTitle: String,
        successToast: String,
        failToast: String,
        image: String,
        imageAlt: String,
      },
    },

    equipmentPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        filterLabel: String,
        searchPlaceholder: String,
        emptyState: String,
        ctaKicker: String,
        ctaTitle: String,
        ctaText: String,
      },
    },

    newsPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        emptyState: String,
        readMoreLabel: String,
        filterLabels: subDocs({ type: String, label: String }, []),
      },
    },

    downloadsPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        emptyState: String,
        downloadLabel: String,
        viewLabel: String,
        typeLabels: subDocs({ type: String, label: String }, []),
      },
    },

    searchPage: {
      type: {
        heroKicker: String,
        heroTitle: String,
        heroLead: String,
        placeholder: String,
        emptyState: String,
        suggestions: textArray,
      },
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    seo: {
      type: {
        siteName: String,
        siteUrl: String,
        defaultDescription: String,
        pages: {
          type: {
            home:          { title: String, description: String },
            about:         { title: String, description: String },
            services:      { title: String, description: String },
            serviceDetail: { title: String, description: String },
            projects:      { title: String, description: String },
            projectDetail: { title: String, description: String },
            capabilities:  { title: String, description: String },
            equipment:     { title: String, description: String },
            readyMix:      { title: String, description: String },
            aggregate:     { title: String, description: String },
            hseq:          { title: String, description: String },
            news:          { title: String, description: String },
            downloads:     { title: String, description: String },
            whereWeWork:   { title: String, description: String },
            careers:       { title: String, description: String },
            contact:       { title: String, description: String },
            search:        { title: String, description: String },
            notFound:      { title: String, description: String },
          },
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);