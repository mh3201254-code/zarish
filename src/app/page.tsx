import Story from "@/components/Story";
import Loader from "@/components/Loader";
import { CollectionsGallery, CraftStats, Featured, InstaStrip, MarqueeBand, Testimonials } from "@/components/HomeSections";
import Faq from "@/components/Faq";
import { ContactForm } from "@/components/ContactForm";

export default function Home() {
  return (
    <>
      <Loader />
      <Story />
      <MarqueeBand />
      <Featured />
      <CollectionsGallery />
      <CraftStats />
      <Testimonials />
      <InstaStrip />
      <section className="container-x grid gap-16 pt-[var(--space-6)] lg:grid-cols-2">
        <div>
          <h2 className="text-5xl md:text-7xl">Questions, answered</h2>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
        <div>
          <h2 className="text-5xl md:text-7xl">Write to us</h2>
          <p className="mb-8 mt-4 text-muted">Ask about a design, a custom order or delivery to your city.</p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
