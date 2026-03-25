"use client";

import { useRef, useState } from "react";

type FileUploadButtonProps = {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
};

export default function FileUploadButton({
  onFilesSelected,
  accept = "image/*,.pdf,.txt,.json",
  multiple = true,
  disabled = false
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isHover, setIsHover] = useState(false);

  function openFileDialog() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (!list) return;

    const files = Array.from(list);

    if (files.length > 0) {
      onFilesSelected(files);
    }

    // reset per consentire re-upload stesso file
    event.target.value = "";
  }

  return (
    <div className="flex items-center">
      {/* INPUT NASCOSTO */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {/* BUTTON */}
      <button
        type="button"
        onClick={openFileDialog}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        disabled={disabled}
        className={`
          flex h-10 w-10 items-center justify-center
          rounded-full
          transition-all duration-200
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          ${isHover ? "bg-[#3a3a3a]" : "bg-[#2f2f2f]"}
        `}
        title="Carica file o immagini"
      >
        {/* ICONA */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.656-5.656L5.757 10.757a6 6 0 108.486 8.486L20 13"
          />
        </svg>
      </button>
    </div>
  );
}
