import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tv2, Film } from "lucide-react";
import { SeriesManager } from "./SeriesManager";
import { MoviesManager } from "./MoviesManager";

export const ContentManager = ({ onChanged }: { onChanged?: () => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Conteúdos</CardTitle>
        <CardDescription>
          Edite ou exclua séries e filmes individualmente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="series" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="series" className="flex items-center gap-2">
              <Tv2 className="w-4 h-4" /> Séries
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="w-4 h-4" /> Filmes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="series" className="mt-0">
            <SeriesManager onChanged={onChanged} embedded />
          </TabsContent>
          <TabsContent value="movies" className="mt-0">
            <MoviesManager onChanged={onChanged} embedded />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};