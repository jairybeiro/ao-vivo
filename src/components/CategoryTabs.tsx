import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) => {
  return (
    <Tabs value={selectedCategory} onValueChange={onSelectCategory} className="w-full">
      <TabsList className="w-full grid grid-cols-6 bg-card border border-border h-10 md:h-12 p-0.5 md:p-1 gap-0.5 md:gap-1">
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
};

export default CategoryTabs;
