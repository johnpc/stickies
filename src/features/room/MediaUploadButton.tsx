import { useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudUploadOutline } from 'ionicons/icons';
import './sticky.css';

/** A dashed "upload a file" tile beside the composer. Opens the native file
 * picker; on selection hands the File to onUpload (which uploads to S3 + creates
 * a media sticky). Accepts any file — the kind is classified from its type. */
export function MediaUploadButton({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        className="sticky sticky--add"
        data-testid="sticky-upload"
        onClick={() => inputRef.current?.click()}
      >
        <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
        <span>Upload a file</span>
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
