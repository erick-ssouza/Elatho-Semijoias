import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    pergunta: 'As semijoias são banhadas em ouro?',
    resposta: 'Sim! Todas as nossas peças possuem banho de ouro 18k de alta qualidade, garantindo durabilidade e brilho por muito mais tempo. Utilizamos uma camada generosa de ouro para assegurar a longevidade das peças.'
  },
  {
    pergunta: 'Qual é o prazo de entrega?',
    resposta: 'O prazo de entrega varia de acordo com a sua região. Em média, para capitais e regiões metropolitanas, o prazo é de 3 a 7 dias úteis. Para outras localidades, pode variar de 7 a 15 dias úteis. Você receberá o código de rastreio assim que o pedido for despachado.'
  },
  {
    pergunta: 'Como funciona o frete grátis?',
    resposta: 'Oferecemos frete grátis para compras acima de R$ 299,00 para todo o Brasil! Para compras abaixo deste valor, o frete é calculado de acordo com a região: Sudeste R$ 15,90, Sul/Centro-Oeste R$ 19,90 e Norte/Nordeste R$ 24,90.'
  },
  {
    pergunta: 'Posso parcelar minha compra?',
    resposta: 'Sim! Parcele em até 10x no cartão de crédito. Para pagamentos via PIX, o pagamento é processado instantaneamente.'
  },
  {
    pergunta: 'As peças têm garantia?',
    resposta: 'Todas as nossas semijoias possuem garantia de 12 meses contra defeitos de fabricação. A garantia não cobre mau uso, oxidação por contato com produtos químicos ou desgaste natural do banho.'
  },
  {
    pergunta: 'Como faço para trocar ou devolver um produto?',
    resposta: 'Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução. O produto deve estar em perfeito estado, sem uso e com a embalagem original. Entre em contato conosco via WhatsApp para iniciar o processo.'
  },
  {
    pergunta: 'As semijoias podem molhar?',
    resposta: 'Recomendamos evitar o contato com água, especialmente água do mar, piscina e produtos químicos. Embora nossas peças sejam de alta qualidade, o contato frequente com esses elementos pode acelerar o desgaste do banho.'
  },
  {
    pergunta: 'Como devo guardar minhas semijoias?',
    resposta: 'Guarde suas peças separadamente, de preferência em saquinhos individuais ou na caixinha que acompanha o produto. Evite deixar em locais úmidos ou expostos ao sol. Isso ajuda a preservar o brilho e a durabilidade.'
  },
  {
    pergunta: 'Vocês fazem peças personalizadas?',
    resposta: 'No momento, trabalhamos apenas com nosso catálogo padrão. Porém, estamos sempre lançando novas coleções! Siga nosso Instagram para ficar por dentro das novidades.'
  },
  {
    pergunta: 'Como faço para rastrear meu pedido?',
    resposta: 'Após o envio, você receberá o código de rastreio por e-mail e WhatsApp. Também pode acessar a página "Rastrear Pedido" em nosso site e informar o número do seu pedido para acompanhar o status.'
  },
  {
    pergunta: 'Como entro em contato com vocês?',
    resposta: 'Você pode nos contatar via WhatsApp (19) 99822-9202, email elathosemijoias@gmail.com ou através do formulário de contato em nosso site. Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.'
  }
];

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes | Elatho Semijoias</title>
        <meta name="description" content="Tire suas dúvidas sobre semijoias Elatho: garantia, frete grátis, formas de pagamento, trocas e devoluções, cuidados com as peças e muito mais." />
        <meta property="og:title" content="Perguntas Frequentes | Elatho Semijoias" />
        <meta property="og:description" content="Dúvidas sobre garantia, frete, pagamento e cuidados com semijoias." />
        <meta property="og:url" content="https://elathosemijoias.com.br/faq" />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href="https://elathosemijoias.com.br/faq" />
      </Helmet>

      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Perguntas <span className="text-gradient-gold">Frequentes</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Tire suas dúvidas sobre nossos produtos, entregas, garantias e muito mais.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="card-elegant px-6 border-none"
                  >
                    <AccordionTrigger className="text-left font-display font-semibold hover:no-underline hover:text-primary py-5">
                      {item.pergunta}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {item.resposta}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Não encontrou o que procurava?
              </p>
              <a 
                href="https://wa.me/5519998229202" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-gold inline-flex"
              >
                Fale Conosco
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
    </>
  );
}
