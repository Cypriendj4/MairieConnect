import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MairieConnect — L\'information municipale simplifiée',
  description: 'Retrouvez toutes les informations et alertes de votre commune. Arrêtés municipaux, travaux, événements et actualités locales.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-700">
              MairieConnect
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</a>
              <a href="/auth/login" className="text-gray-600 hover:text-blue-700">Connexion</a>
            </nav>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
          <p>MairieConnect &copy; {new Date().getFullYear()} &mdash; Données publiques municipales</p>
        </footer>
      </body>
    </html>
  );
}