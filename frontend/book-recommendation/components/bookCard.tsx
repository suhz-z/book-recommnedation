"use client";
import { Book } from "@/types/types";
import Image from "next/image";

type Props = {
  book: Book;
  onChoose?: (b: Book) => void;
};

export default function BookCard({ book, onChoose }: Props) {
  const img = book["Image-URL-M"] || book["Image-URL-L"] || book["Image-URL-S"];
  return (
    <div className="flex gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition">
      <img
        src={img}
        alt={book["Book-Title"]}
        className="w-24 h-36 object-cover rounded"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="240"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3ENo+Image%3C/text%3E%3C/svg%3E';
        }}
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{book["Book-Title"]}</h3>
            <p className="text-sm text-gray-600">{book["Book-Author"]}</p>
            <p className="text-sm text-gray-500 mt-1">
              {book["Publisher"]} • {book["Year-Of-Publication"]}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => onChoose && onChoose(book)}
              className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
            >
              Choose
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
