import { ChatWidget } from "@/components/chat-widget";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Conversational Ads Demo
          </h1>
          <p className="text-lg text-slate-600">
            Test the chat widget - click the bubble in the bottom right corner
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
              <p className="text-sm text-blue-800">
                This is an Intercom-style chat widget for product discovery. Visitors can
                ask questions about products and receive intelligent recommendations. The
                widget can be embedded on any landing page to convert conversations into discoveries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Landing Page Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="space-y-12">
          {/* Featured Products Section */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-slate-900 mb-1">Product {i}</h3>
                    <p className="text-sm text-slate-500 mb-2">Placeholder product description</p>
                    <p className="text-lg font-semibold text-blue-600">$99.00</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* About Section */}
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">About Us</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-600 leading-relaxed">
                This is a demo landing page showcasing the conversational ads feature.
                In production, visitors would see your actual products and brand content.
                The chat widget provides an interactive way for visitors to discover products
                through natural conversation rather than traditional browsing.
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-8">
            <p className="text-slate-500 mb-4">
              Have questions? Click the chat bubble to start a conversation!
            </p>
            <div className="inline-flex items-center gap-2 text-blue-600">
              <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="font-medium">Try the chat widget below</span>
            </div>
          </section>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget
        initialMessage="Hi! I'm here to help you discover products. What are you looking for today?"
      />
    </div>
  );
}
