const LegalTerms = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12 max-w-3xl prose dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>
          By using GEG, you agree to use the platform lawfully and to provide accurate information when applying to programs.
        </p>
        <h2>Acceptable use</h2>
        <p>No unauthorized access, scraping, or abuse of platform resources.</p>
        <h2>Liability</h2>
        <p>
          GEG provides tools and guidance but does not guarantee admissions outcomes.
        </p>
        <p>
          Questions? Email <a className="text-primary" href="mailto:info@globaltalentgateway.com">info@globaltalentgateway.com</a>.
        </p>
      </section>
    </div>
  );
};

export default LegalTerms;
