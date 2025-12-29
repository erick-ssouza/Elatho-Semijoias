export default function Features() {
  return (
    <section className="py-12 border-y border-border">
      <div className="container px-6 lg:px-12">
        {/* Horizontal layout - text only */}
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Garantia 1 ano
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Frete grátis +R$299
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Parcelamos 3x
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Atendimento exclusivo
          </span>
        </div>
      </div>
    </section>
  );
}