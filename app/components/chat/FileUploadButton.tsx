"use client";

import { useState } from "react";
import FileUploadButton from "./FileUploadButton";

type JokerChatInputProps = {
  onSubmit: (payload: { message: string; files: File[] }) => void;
  disabled?: boolean;
};

export default function JokerChatInput({
  onSubmit,
  disabled = false
}: JokerChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  function handleFilesSelected(selected: File[]) {
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed && files.length === 0) {
      return;
    }

    onSubmit({
      message: trimmed,
      files
    });

    setMessage("");
    setFiles([]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/10 bg-[#212121] px-4 py-4"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[28px] border border-white/10 bg-[#2f2f2f] p-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={disabled}
            className="min-h-[110px] w-full resize-none border-none bg-transparent px-3 py-3 text-sm leading-7 text-white outline-none placeholder:text-neutral-500 disabled:opacity-60"
            placeholder="Scrivi l’input per JOKER-C2..."
          />

          {files.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 px-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-3 py-2 text-xs text-neutral-300"
                >
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-neutral-400 hover:text-white"
                    aria-label={`Rimuovi ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2">
              <FileUploadButton
                onFilesSelected={handleFilesSelected}
                disabled={disabled}
                accept="image/*,.pdf,.txt,.md,.json,.csv"
                multiple
              />

              <div className="text-xs text-neutral-400">
                File e foto
              </div>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Invia
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
