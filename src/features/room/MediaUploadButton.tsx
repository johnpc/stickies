import { useRef } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { cloudUploadOutline } from 'ionicons/icons';
import './sticky.css';

interface MediaUploadButtonProps {
  onUpload: (file: File) => void;
  /** True while an upload is in flight — shows a spinner + "Uploading…" and
   * disables the tile so a slow upload gives feedback and can't be double-fired. */
  pending?: boolean;
}

/** A dashed "upload a file" tile beside the composer. Opens the native file
 * picker; on selection hands the File to onUpload (which uploads to S3 + creates
 * a media sticky). Accepts any file — the kind is classified from its type. */
export function MediaUploadButton({ onUpload, pending }: MediaUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        className="sticky sticky--add"
        data-testid="sticky-upload"
        disabled={pending}
        aria-busy={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          <>
            <IonSpinner name="crescent" data-testid="upload-spinner" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
            <span>Upload a file</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        data-testid="sticky-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </>
  );
}
