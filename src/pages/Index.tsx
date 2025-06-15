
import CameraMatchaApp from "@/components/CameraMatchaApp";
import { Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-pink-50 via-green-50 to-purple-50 text-foreground">
      <header className="py-8 px-10 border-b-2 border-pink-200 flex items-center space-x-4 bg-gradient-to-r from-green-100 via-pink-100 to-purple-100 relative overflow-hidden">
        {/* Floating sparkles */}
        <Star className="absolute top-4 right-20 w-6 h-6 fill-yellow-300 text-yellow-300 animate-pulse" />
        <Star className="absolute top-8 right-40 w-4 h-4 fill-pink-300 text-pink-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Star className="absolute top-6 right-60 w-5 h-5 fill-purple-300 text-purple-300 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <span className="inline-flex items-center gap-3 text-4xl font-bold text-green-700 tracking-tight">
          <div className="relative">
            <svg width="48" height="48" viewBox="0 0 18 18" fill="none" className="drop-shadow-lg">
              <ellipse cx="9" cy="13" rx="6" ry="3" fill="#93c47d"/>
              <ellipse cx="9" cy="7" rx="5.5" ry="3.5" fill="#b6d7a8"/>
              <ellipse cx="9" cy="10" rx="7.5" ry="4" stroke="#639c59" strokeWidth="1.5"/>
            </svg>
            <Star className="absolute -top-1 -right-1 w-3 h-3 fill-yellow-400 text-yellow-400" />
          </div>
          Kawaii Matcha Cup Rater ✨
        </span>
        <span className="ml-auto text-sm text-pink-600 font-medium hidden md:block bg-white/70 px-4 py-2 rounded-full">
          📸 Capture cute matcha moments! Rate the kawaii-ness! 🍵✨
        </span>
      </header>
      
      <main className="grow flex flex-col lg:flex-row">
        <section className="w-full lg:w-[480px] border-r-2 border-pink-200 bg-gradient-to-b from-green-50/50 to-pink-50/50 flex flex-col items-center py-8 gap-8 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Star className="absolute top-20 left-10 w-8 h-8 fill-yellow-200 text-yellow-200 opacity-50 animate-pulse" />
            <Star className="absolute top-40 right-12 w-6 h-6 fill-pink-200 text-pink-200 opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
            <Star className="absolute bottom-32 left-8 w-7 h-7 fill-purple-200 text-purple-200 opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          <CameraMatchaApp />
        </section>
        
        <section className="grow flex justify-center items-center bg-gradient-to-br from-white to-pink-50/30 relative">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🍵</div>
            <div className="text-2xl font-bold text-green-700 mb-2">Ready to rate some kawaii matcha? ✨</div>
            <div className="text-gray-600">Point your camera at a matcha cup and let the magic happen!</div>
          </div>
          
          {/* Floating decoration */}
          <Star className="absolute top-20 right-20 w-12 h-12 fill-yellow-100 text-yellow-200 opacity-60 animate-pulse" />
          <Star className="absolute bottom-20 left-20 w-10 h-10 fill-pink-100 text-pink-200 opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </section>
      </main>
      
      <footer className="py-4 px-4 text-xs text-center text-pink-500 border-t-2 border-pink-200 bg-gradient-to-r from-green-50 to-pink-50">
        <div className="flex items-center justify-center gap-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          &copy; {new Date().getFullYear()} Kawaii Matcha Cup Rater &mdash; built with Love &amp; Lovable ✨
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
