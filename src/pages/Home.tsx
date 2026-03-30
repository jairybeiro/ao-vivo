import MainHeader from "@/components/MainHeader";
import { Tv } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <MainHeader transparent />

      {/* Hero Section - Limpo */}
      <div className="relative w-full bg-gradient-to-br from-primary/10 to-background min-h-[60vh] flex items-center justify-center">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Tv className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Bem-vindo ao StreamPlayer
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore conteúdos exclusivos, curadorias especiais e muito mais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <a 
              href="/entretenimento" 
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Explorar Conteúdo
            </a>
            <a 
              href="/channels" 
              className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Ver Canais
            </a>
          </div>
        </div>
      </div>

      {/* Seção de Boas-vindas */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-primary/20 flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Conteúdo Exclusivo</h3>
            <p className="text-sm text-muted-foreground">
              Acesse filmes, séries e conteúdos curados especialmente para você.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-primary/20 flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Canais ao Vivo</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe seus canais favoritos em tempo real.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-primary/20 flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Qualidade HD</h3>
            <p className="text-sm text-muted-foreground">
              Desfrute de uma experiência de visualização em alta qualidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
