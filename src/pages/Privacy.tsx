import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white border border-neutral-100 p-10">
        <h1 className="text-3xl font-serif font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          This is a placeholder privacy policy. Replace with your actual privacy policy text.
        </p>
        <div className="mt-6">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-brand-onyx">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
