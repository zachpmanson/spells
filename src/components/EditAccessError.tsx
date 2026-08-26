import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

// Friendly error state for the edit routes (/edit/$id and /deck/edit/$id).
// The loaders throw 'Not authorized to edit this card/deck' when the resource
// is owned by a different account — without this the user would see a bare
// internal error with no way forward. Distinguish that real, explainable case
// from a generic load failure so the message matches what actually happened.
export default function EditAccessError({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const notAuthorized = message.toLowerCase().includes('not authorized')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      {notAuthorized ? (
        <>
          <h1 className="text-2xl font-bold">You can't edit this</h1>
          <p className="max-w-md text-slate-600">
            This belongs to another account. You can view a read-only copy of
            it and fork your own version to edit — open the shared link for
            this card or deck and choose <strong>Fork</strong>.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Couldn't open this for editing</h1>
          <p className="max-w-md text-slate-600">
            It may have been removed, or the link may be invalid.
          </p>
        </>
      )}
      <Link
        to="/"
        className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
      >
        Back to library
      </Link>
    </div>
  )
}
