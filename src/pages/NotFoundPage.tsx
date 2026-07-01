import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center text-slate-100">
      <div className="rounded-[32px] border border-slate-800/80 bg-slate-950/80 p-10 shadow-glow backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
        <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-slate-400">The route you are looking for does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500">
          Return home
        </Link>
      </div>
    </div>
  )
}
