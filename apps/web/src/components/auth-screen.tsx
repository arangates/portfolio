import Image from "next/image";

export function AuthScreen({
  title,
  children,
  footer,
  note,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <main className="dark min-h-svh bg-[#090a0b] px-6 py-10 text-[#f3f3f3]">
      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center">
        <section className="w-full max-w-[330px]" aria-labelledby="auth-title">
          <div className="mb-8 flex justify-center">
            <Image
              src="/selvam-mark.svg"
              alt="Selvam"
              width={40}
              height={40}
              priority
              data-no-outline
              className="size-10"
            />
          </div>
          <h1 id="auth-title" className="mb-6 text-center text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {children}
          {note ? (
            <p className="mt-8 text-center text-xs leading-relaxed text-white/45">{note}</p>
          ) : null}
          <div className="mt-8 text-center text-sm text-white/55">{footer}</div>
        </section>
      </div>
    </main>
  );
}

export const authSecondaryButtonClass =
  "h-[50px] w-full rounded-full border border-white/[0.04] bg-[#1b1b1d] text-sm font-medium text-white/90 shadow-none hover:bg-[#252527] hover:text-white focus-visible:ring-[#7379e8]";

export const authPrimaryButtonClass =
  "h-[50px] w-full rounded-full border-0 bg-[#5f66d8] text-sm font-medium text-white shadow-none hover:bg-[#6b72e3] focus-visible:ring-[#9297ff]";

export const authInputClass =
  "h-11 rounded-lg border-[#38383b] bg-[#171719] text-white placeholder:text-white/35 focus-visible:border-[#777de9] focus-visible:ring-[#777de9]/35";
