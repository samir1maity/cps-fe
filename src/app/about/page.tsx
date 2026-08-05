import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Creative Pottery Studio',
  description:
    'Learn about Creative Pottery Studio — where the artistic heritage of Santiniketan meets contemporary fine art. Handcrafted ceramics rooted in earth, creativity, and purpose.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-amber-50/40">

      {/* Hero band */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--brand-600)] font-semibold mb-3">
            Our Story
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
            About Us
          </h1>
          <p className="text-stone-500 text-sm">
            Where the soul of Santiniketan shapes every piece we make.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 text-stone-700 text-base leading-8">

        <div className="bg-white border border-stone-100 rounded-2xl p-7 sm:p-10 shadow-sm space-y-6">

          <p>
            Welcome to <strong className="text-stone-900">Creative Pottery Studio</strong>, where the artistic
            heritage of Santiniketan meets the refined evolution of contemporary fine art. Our journey began at{' '}
            <strong className="text-stone-900">Kala Bhavana, Visva-Bharati University</strong>, where our founders
            honed their craft through years of academic immersion. But more than degrees, we try to carry the ethos
            of a place that breathes creativity, passion and responsibility.
          </p>

          <hr className="border-stone-100" />

          <p>
            We believe that art shouldn't live behind a glass case; it belongs in your hands. Our mission is to
            bring high art within your reach through pieces that are as functional as they are unique. Though, one
            can simply cherish the aesthetics keeping aside the functionality and get amazed. Each creation serves a
            greater purpose, acting as a bridge between{' '}
            <em className="text-stone-600">pure aesthetic and daily utility</em>.
          </p>

          <hr className="border-stone-100" />

          <p>
            This website is our virtual window, but our heart beats at our physical studio in{' '}
            <strong className="text-stone-900">Santiniketan</strong>. Here, at our studio, the process of creation
            begins with research, design, preparation of clay, indigenous and exclusive glaze recipes and much more,
            all keeping earth, its tones and forms in mind. There, you can feel the textures, see the thumbprints
            of the maker, and witness how we pour our souls into the slow, meditative process of creation.
          </p>

          <p>
            We are a home-grown, sustainable endeavor, intending to pour back the inspiration we've gathered from
            this ecosystem to every piece we fire.
          </p>

        </div>

        {/* Three values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              emoji: '🌿',
              title: 'Rooted in Earth',
              body: 'Every glaze, every clay body is chosen with the earth in mind — its tones, its textures, its forms.',
            },
            {
              emoji: '🎨',
              title: 'Born in Santiniketan',
              body: 'Our creative DNA traces back to Kala Bhavana, where art is not studied — it is lived.',
            },
            {
              emoji: '🤲',
              title: 'Made by Hand',
              body: 'Each piece bears the quiet mark of its maker — a thumbprint, a breath, an intention.',
            },
          ].map(({ emoji, title, body }) => (
            <div key={title} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm text-center space-y-3">
              <div className="text-3xl">{emoji}</div>
              <h3 className="font-semibold text-stone-900 text-sm">{title}</h3>
              <p className="text-stone-500 text-xs leading-6">{body}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
