import { forwardRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = forwardRef<HTMLDivElement, CategoryTabsProps>(
  ({ categories, selectedCategory, onSelectCategory }, ref) => {
    return (
      <Tabs ref={ref} value={selectedCategory} onValueChange={onSelectCategory} className="w-full">
        <TabsList className={`w-full grid bg-card border border-border h-10 md:h-12 p-0.5 md:p-1 gap-0.5 md:gap-1`} style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-1 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground truncate"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }
);

CategoryTabs.displayName = "CategoryTabs";

export default CategoryTabs;
