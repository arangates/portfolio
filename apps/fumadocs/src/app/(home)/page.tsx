import Link from "next/link";

const topics = [
  ["Features", "What the portfolio tracks and calculates."],
  ["Architecture", "The important technology and modelling decisions."],
  ["Security", "How account isolation and secrets are handled."],
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-medium text-fd-muted-foreground">Product handbook</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Aranga Portfolio</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
          Concise documentation for the portfolio features, historical data model, security
          boundaries and production operation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground"
          >
            Read the handbook
          </Link>
          <Link
            href="/docs/deployment"
            className="rounded-lg border bg-fd-card px-5 py-2.5 text-sm font-medium"
          >
            Deployment guide
          </Link>
        </div>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {topics.map(([title, description]) => (
          <div key={title} className="rounded-xl border bg-fd-card p-5">
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
