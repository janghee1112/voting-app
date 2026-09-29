import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "투표 앱",
  description: "질문을 올리고 선택지 중 하나를 골라 투표하는 간단한 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              투표 앱
            </Link>
            <Link
              href="/new"
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
            >
              + 투표 만들기
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
