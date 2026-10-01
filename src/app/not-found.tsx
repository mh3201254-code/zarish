import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x grid min-h-[70vh] place-items-center py-24 text-center">
      <div>
        <p className="gold-text font-display text-[clamp(6rem,22vw,16rem)] leading-none">404</p>
        <h1 className="mt-2 text-4xl md:text-5xl">This page has gone missing</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">The link may be old or mistyped. The shop is a good place to start again.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop/" className="btn btn-gold">Browse the shop</Link>
          <Link href="/" className="btn btn-line">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
