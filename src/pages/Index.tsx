
import CameraMatchaApp from "@/components/CameraMatchaApp";

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      <header className="py-6 px-10 border-b flex items-center space-x-4 bg-gradient-to-r from-green-100 to-green-50">
        <span className="inline-flex items-center gap-2 text-3xl font-bold text-green-700 tracking-tight">
          <svg width="36" height="36" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="13" rx="6" ry="3" fill="#93c47d"/><ellipse cx="9" cy="7" rx="5.5" ry="3.5" fill="#b6d7a8"/><ellipse cx="9" cy="10" rx="7.5" ry="4" stroke="#639c59" strokeWidth="1.5"/></svg>
          Matcha Cup Rater
        </span>
        <span className="ml-auto text-sm text-muted-foreground hidden md:block">
          Capture or upload an image, rate your matcha’s color!
        </span>
      </header>
      <main className="grow flex flex-col lg:flex-row">
        <section className="w-full lg:w-[460px] border-r bg-muted/50 flex flex-col items-center py-8 gap-8">
          <CameraMatchaApp />
        </section>
        <section className="grow flex justify-center items-center bg-background"></section>
      </main>
      <footer className="py-2 px-4 text-xs text-center text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Matcha Cup Rater &mdash; built with Love &amp; Lovable.
      </footer>
    </div>
  );
};

export default Index;
