import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Category } from "@/entities/Category";

const defaultCategories = [
  {
    name: "Ghee Sweets",
    slug: "ghee_sweets",
    image_url: "https://images.unsplash.com/photo-1606312617937-5e8e6f17c2ce?w=400&q=80",
    description: "Rich, buttery delights"
  },
  {
    name: "Milk Sweets",
    slug: "milk_sweets",
    image_url: "https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=400&q=80",
    description: "Creamy traditional treats"
  },
  {
    name: "Cashew Sweets",
    slug: "cashew_sweets",
    image_url: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80",
    description: "Premium nutty goodness"
  },
  {
    name: "Dry Fruit Sweets",
    slug: "dry_fruit_sweets",
    image_url: "https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400&q=80",
    description: "Packed with nutrition"
  },
  {
    name: "Savouries",
    slug: "savouries",
    image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
    description: "Crispy & crunchy snacks"
  },
  {
    name: "Hampers",
    slug: "hampers",
    image_url: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&q=80",
    description: "Perfect gift boxes"
  }
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const activeCategories = await Category.filter({ active: true }, "order");
      if (activeCategories.length > 0) {
        setCategories(activeCategories);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      setCategories(defaultCategories);
    }
  };

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#5C4033] mb-4" style={{fontFamily: 'Georgia, serif'}}>
          Shop by Category
        </h2>
        <p className="text-[#8B6F47] text-lg">Explore our wide range of delicacies.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={createPageUrl(`Products?category=${category.slug}`)}
              className="group block cursor-pointer"
            >
              <div className="relative aspect-square rounded-full overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300">
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-center font-bold text-[#5C4033] group-hover:text-[#FED800] transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-center text-xs text-[#8B6F47] mt-1">{category.description}</p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}