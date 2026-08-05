import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Creative Pottery Studio',
  description: 'Read the terms and conditions for shopping at Creative Pottery Studio.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-gray-700 text-sm leading-7">

          <p>
            Welcome to Creative Pottery Studio. We want your experience of bringing our handcrafted ceramic items
            into your home to be as smooth as possible. By placing an order on our website, you agree to the
            following simple guidelines.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. The Beauty of Handmade</h2>
            <p className="mb-3">
              Because our ceramics are 100% handcrafted through an elaborate artistic process, no two pieces are
              ever identical.
            </p>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">Unique Fingerprints:</strong> Slight variations in shape, size,
                  or glaze (like tiny speckles or color shifts) are not flaws—they are the "fingerprints" of the
                  maker and the kiln.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">Artistic Character:</strong> These minor differences make your
                  piece truly one of a kind. For this reason, we may not offer returns based on these natural and
                  artistic variations.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">Digitalization:</strong> Though we always focus on using
                  naturalistic reference of our items, the actual appearance of the item may feel slightly different
                  in hand when compared to images provided on our website, due to digitalization and difference in
                  type of Smartphone or PC screens.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Let's Unbox Together (Mandatory Video)</h2>
            <p className="mb-3">
              We pack our ceramics with extreme care to ensure they survive the journey. However, since ceramics is
              fragile, we have one small request to help us help you:
            </p>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">The Request:</strong> Please record a continuous unboxing video
                  from the moment you start opening the package seal until the item is fully out and inspected and
                  share it with us within 5 days for any enquiry.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">Why?</strong> This video is our only way to claim insurance
                  from the courier partner and quickly process a replacement for you. Without this video, we
                  unfortunately cannot entertain claims for damage or missing items.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Returns &amp; Exchanges</h2>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">When can I return?</strong> If your item arrives broken or you
                  received the wrong item (verified by your unboxing video), our team will happily fix it.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">The Timeline:</strong> As we are a small, dedicated team,
                  please allow 10 to 15 business days for us to process your query for replacement.
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Shipping &amp; Delivery</h2>
            <ul className="space-y-2 pl-1">
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">Handled with Care:</strong> We use secure, best protective
                  packaging.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 shrink-0 text-[var(--brand-600)]">•</span>
                <span>
                  <strong className="text-gray-900">The Journey:</strong> We will need 5 to 7 business days to
                  dispatch your order. For any unavoidable circumstances if we are not able to dispatch, an
                  intimation will be duly provided. Once the package leaves our studio in Santiniketan, we rely on
                  our courier partners. We aren't responsible for damages or delays caused by weather, strikes, or
                  incorrect addresses provided during checkout—so please double-check your details!
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Price &amp; Product Accuracy</h2>
            <p>
              We try to keep everything perfect, but if a technical glitch leads to a product being listed at an
              incorrect price or description, we reserve the right to cancel the order and provide you with a full
              refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Ownership of Designs</h2>
            <p>
              Every design, photo, and story on this website belongs to Creative Pottery Studio. We love it when
              you share our work on social media, but commercial reproduction or reselling of our designs is
              strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Legal Bits</h2>
            <p>
              While we aim for a happy resolution every time, any legal matters will be settled under the
              jurisdiction of the courts in Bolpur/Birbhum, West Bengal.
            </p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Want to know more?</h2>
            <p>
              If you're unsure about anything, just reach out to us before you buy. Our team is always dedicated
              to help you with your queries.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
