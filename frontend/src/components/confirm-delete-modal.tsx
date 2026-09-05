"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemType?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = "Record",
  description,
  confirmButtonText = "Yes, Delete Permanently",
  cancelButtonText = "Cancel",
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (err) {
      console.error("Delete action error:", err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const defaultTitle = `Delete ${itemType}?`;
  const defaultDesc = description || (
    <span>
      Are you sure you want to delete{" "}
      {itemName ? <strong className="text-[#0F172A] font-bold">"{itemName}"</strong> : `this ${itemType.toLowerCase()}`}?{" "}
      This action cannot be undone and will permanently remove this record from the database.
    </span>
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={isDeleting ? undefined : onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col p-6 space-y-5">
        {/* Header with Danger Icon & Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Confirm Deletion
              </span>
              <h3 className="text-base font-bold text-[#0F172A] mt-1">
                {title || defaultTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Context Box (If itemName exists) */}
        {itemName && (
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B] flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                Target {itemType}
              </span>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {itemName}
              </p>
            </div>
          </div>
        )}

        {/* Warning Description */}
        <div className="text-xs text-[#64748B] leading-relaxed">
          {defaultDesc}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelButtonText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
