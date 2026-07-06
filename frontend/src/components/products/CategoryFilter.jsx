import React from "react";
import { Button } from "@/components/ui/button";

const categories = [
    { value: "all", label: "All" },
    { value: "mysurpa", label: "Mysurpa" },
    { value: "ghee_sweets", label: "Ghee Sweets" },
    { value: "milk_sweets", label: "Milk Sweets" },
    { value: "cashew_sweets", label: "Cashew Sweets" },
    { value: "dry_fruit_sweets", label: "Dry Fruit Sweets" },
    { value: "savouries", label: "Savouries" },
    { value: "hampers", label: "Hampers" },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          variant={selectedCategory === category.value ? "default" : "outline"}
          className={`whitespace-nowrap font-medium rounded-full shadow-sm px-6 py-2 h-auto ${
            selectedCategory === category.value
              ? "bg-gradient-to-r from-[#5C4033] to-[#8B6F47] text-white hover:opacity-90"
              : "border-gray-300 bg-white text-[#5C4033] hover:bg-gray-100"
          }`}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}