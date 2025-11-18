"use client";
import React from "react";
import { Book } from "@/types/types";

type Props = {
  readingList: Book[];
  onRemove: (isbn: string) => void;
};

export default function Sidebar({ readingList, onRemove }: Props) {
  return (
    <aside className="space-y-4">
      <div className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold">Reading List</h3>
        <div className="mt-3 space-y-2">
          {readingList.length === 0 && (
            <p className="text-sm text-gray-500">Empty — add books you like</p>
          )}
          {readingList.map((b) => (
            <div key={b.ISBN} className="flex items-center gap-3">
              <img
                src={b["Image-URL-S"] || b["Image-URL-M"]}
                alt={b["Book-Title"]}
                className="w-10 h-14 object-cover rounded"
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{b["Book-Title"]}</div>
                <div className="text-gray-500">{b["Book-Author"]}</div>
              </div>
              <button
                onClick={() => onRemove(b.ISBN)}
                className="text-sm px-2 py-1 bg-red-100 rounded text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold">Utilities</h3>
        <div className="mt-3 space-y-2 text-sm">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(location.origin);
            }}
            className="w-full px-3 py-2 bg-gray-100 rounded"
          >
            Copy page URL
          </button>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="w-full px-3 py-2 bg-gray-100 rounded"
          >
            Reload page
          </button>
        </div>
      </div>

      
    </aside>
  );
}
