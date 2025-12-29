import bgCrystals from '@/assets/bg-crystals.jpg';

interface BackgroundLayoutProps {
  children: React.ReactNode;
}

export default function BackgroundLayout({ children }: BackgroundLayoutProps) {
  return (
    <>
      {/* Fixed background with crystals in corner */}
      <img 
        src={bgCrystals} 
        alt="" 
        className="fixed bottom-0 left-0 w-[500px] max-w-[50vw] h-auto pointer-events-none select-none opacity-80"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative min-h-screen bg-background/95" style={{ zIndex: 1 }}>
        {children}
      </div>
    </>
  );
}
