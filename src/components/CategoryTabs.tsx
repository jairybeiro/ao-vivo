import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) => {
  return (
    <Tabs value={selectedCategory} onValueChange={onSelectCategory} className="w-full">
      <TabsList className="w-full justify-start bg-card border border-border h-12 p-1 gap-1">
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            className="px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default CategoryTabs;
