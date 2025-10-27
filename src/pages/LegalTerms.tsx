import BackButton from '@/components/BackButton';

const LegalTerms = () => {
  const lastUpdated = 'October 22, 2025';
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 py-6 flex items-center gap-3">
          <BackButton variant="ghost" className="px-0" label="Back" />
          <div>
            <h1 className="text-2xl font-semibold">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Please read these Terms carefully. Last updated {lastUpdated}.</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">On this page</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#acceptance" className="hover:underline">Acceptance of Terms</a></li>
              <li><a href="#eligibility" className="hover:underline">Eligibility</a></li>
              <li><a href="#accounts" className="hover:underline">Accounts & Security</a></li>
              <li><a href="#acceptable-use" className="hover:underline">Acceptable Use</a></li>
              <li><a href="#user-content" className="hover:underline">Your Content</a></li>
              <li><a href="#payments" className="hover:underline">Fees & Payments</a></li>
              <li><a href="#changes" className="hover:underline">Service Changes</a></li>
              <li><a href="#third-parties" className="hover:underline">Third‑Party Services</a></li>
              <li><a href="#disclaimers" className="hover:underline">Disclaimers</a></li>
              <li><a href="#liability" className="hover:underline">Limitation of Liability</a></li>
              <li><a href="#indemnity" className="hover:underline">Indemnification</a></li>
              <li><a href="#termination" className="hover:underline">Termination</a></li>
              <li><a href="#governing-law" className="hover:underline">Governing Law</a></li>
              <li><a href="#changes-to-terms" className="hover:underline">Changes to These Terms</a></li>
              <li><a href="#contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>
        </nav>

        <section className="prose dark:prose-invert max-w-none">
          <p>
            These Terms of Service ("Terms") govern your access to and use of GEG — Global Education Gateway
            ("GEG", "we", "us", or "our") products, websites, and services (collectively, the "Services"). By
            accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy.
          </p>

          <h2 id="acceptance">Acceptance of Terms</h2>
          <p>
            You may use the Services only in compliance with these Terms and all applicable laws. If you are using the
            Services on behalf of an organization, you represent that you have the authority to accept these Terms on
            its behalf and that the organization agrees to be responsible for your use of the Services.
          </p>

          <h2 id="eligibility">Eligibility</h2>
          <p>
            You must be the age of majority in your jurisdiction (or have verifiable parental/guardian consent) to use
            the Services. You agree to provide accurate, current, and complete information during registration and to
            keep it up to date.
          </p>

          <h2 id="accounts">Accounts & Security</h2>
          <ul>
            <li>You are responsible for safeguarding your account credentials and for all activity under your account.</li>
            <li>Notify us immediately of any unauthorized use or suspected breach of security.</li>
            <li>We may suspend or terminate accounts that violate these Terms or present security risks.</li>
          </ul>

          <h2 id="acceptable-use">Acceptable Use</h2>
          <p>When using the Services, you agree not to:</p>
          <ul>
            <li>Violate any law, contract, intellectual property, or other third‑party right.</li>
            <li>Access, tamper with, or use non‑public areas or systems of the Services.</li>
            <li>Circumvent or probe any security or authentication measures.</li>
            <li>Scrape, crawl, or spider the Services without prior written consent.</li>
            <li>Use the Services to send spam, conduct fraud, or interfere with service integrity.</li>
            <li>Upload harmful code or content that is illegal, misleading, or defamatory.</li>
          </ul>

          <h2 id="user-content">Your Content</h2>
          <p>
            You retain ownership of content you submit to the Services. You grant GEG a worldwide, non‑exclusive,
            royalty‑free license to host, store, reproduce, and display that content solely to operate and improve the
            Services. You represent that you have the rights to submit the content and that it does not infringe the
            rights of others.
          </p>

          <h2 id="payments">Fees & Payments</h2>
          <p>
            Some parts of the Services may be offered for a fee. Prices and features may change from time to time with
            reasonable notice where required. Unless otherwise stated, fees are non‑refundable except where required by
            law.
          </p>

          <h2 id="changes">Service Changes</h2>
          <p>
            We may add, modify, or discontinue all or part of the Services at any time. Where practicable, we will
            provide notice of material changes that adversely affect your use of the Services.
          </p>

          <h2 id="third-parties">Third‑Party Services</h2>
          <p>
            The Services may reference or integrate third‑party products or services. Your use of any third‑party
            services is subject to their separate terms, and we are not responsible for third‑party content, products, or
            practices.
          </p>

          <h2 id="disclaimers">Disclaimers</h2>
          <p>
            GEG facilitates connections between students, agents, and educational institutions but does not control
            admissions decisions and does not guarantee specific outcomes, offers, or timelines. The Services are
            provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, or
            statutory, including without limitation warranties of merchantability, fitness for a particular purpose, and
            non‑infringement.
          </p>

          <h2 id="liability">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, GEG and its affiliates will not be liable for any indirect,
            incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues,
            data, goodwill, or other intangible losses resulting from your use of or inability to use the Services.
          </p>

          <h2 id="indemnity">Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless GEG, its affiliates, and their respective officers,
            directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses,
            including reasonable legal fees, arising out of or in any way connected with your violation of these Terms or
            your misuse of the Services.
          </p>

          <h2 id="termination">Termination</h2>
          <p>
            We may suspend or terminate your access to the Services at any time, with or without notice, for conduct
            that we believe violates these Terms or is otherwise harmful to other users, us, or third parties. You may
            stop using the Services at any time.
          </p>

          <h2 id="governing-law">Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which GEG is established, without regard to its
            conflicts of law principles. Where required, exclusive venue will lie in the competent courts of that
            jurisdiction.
          </p>

          <h2 id="changes-to-terms">Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will provide notice by posting
            an updated version and updating the “Last updated” date. Your continued use of the Services after changes
            become effective constitutes acceptance of the revised Terms.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            Questions about these Terms? Email <a className="text-primary" href="mailto:info@globaleducationgateway.com">info@globaleducationgateway.com</a>.
          </p>

          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </section>
      </main>
    </div>
  );
};

export default LegalTerms;
