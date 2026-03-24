import MainHeader from "@/components/MainHeader";
import { Film } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Film className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
          Conteúdo em breve
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md">
          Estamos preparando algo incrível para você. Fique ligado!
        </p>
      </div>
    </div>
  );
};

export default Home;
