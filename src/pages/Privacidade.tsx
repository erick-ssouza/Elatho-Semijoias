import { Shield, Database, Eye, Trash2, Mail, Lock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-champagne/30 to-background">
          <div className="container px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-fade-in">
              Política de <span className="text-gradient-gold">Privacidade</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
              Sua privacidade é importante para nós. Saiba como coletamos, usamos e protegemos seus dados.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Última atualização: Janeiro de 2025
            </p>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="py-16 md:py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto space-y-12">
              
              {/* Coleta de Dados */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">1. Coleta de Dados</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>
                    Coletamos informações que você nos fornece diretamente ao realizar uma compra 
                    ou entrar em contato conosco:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Nome completo</li>
                    <li>Endereço de email</li>
                    <li>Número de telefone/WhatsApp</li>
                    <li>CPF (para emissão de nota fiscal)</li>
                    <li>Endereço de entrega</li>
                    <li>Informações de pagamento (processadas por terceiros seguros)</li>
                  </ul>
                </div>
              </div>

              {/* Uso dos Dados */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">2. Uso dos Dados</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>Utilizamos suas informações para:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Processar e entregar seus pedidos</li>
                    <li>Enviar atualizações sobre o status do pedido</li>
                    <li>Emitir notas fiscais</li>
                    <li>Responder suas dúvidas e solicitações</li>
                    <li>Enviar novidades e promoções (com seu consentimento)</li>
                    <li>Melhorar nossos produtos e serviços</li>
                  </ul>
                </div>
              </div>

              {/* Proteção */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">3. Proteção dos Dados</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>
                    Implementamos medidas de segurança técnicas e organizacionais para proteger 
                    seus dados pessoais contra acesso não autorizado, alteração, divulgação ou 
                    destruição. Isso inclui:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Criptografia SSL/TLS em todas as comunicações</li>
                    <li>Armazenamento seguro em servidores protegidos</li>
                    <li>Acesso restrito aos dados apenas por funcionários autorizados</li>
                    <li>Processamento de pagamentos por plataformas certificadas (PCI-DSS)</li>
                  </ul>
                </div>
              </div>

              {/* Compartilhamento */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">4. Compartilhamento</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>
                    Não vendemos, alugamos ou compartilhamos suas informações pessoais com 
                    terceiros para fins de marketing. Compartilhamos dados apenas com:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Transportadoras (para entrega dos pedidos)</li>
                    <li>Processadores de pagamento (para transações seguras)</li>
                    <li>Autoridades legais (quando exigido por lei)</li>
                  </ul>
                </div>
              </div>

              {/* Seus Direitos */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">5. Seus Direitos (LGPD)</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>
                    De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Acessar seus dados pessoais que mantemos</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar consentimento para comunicações de marketing</li>
                    <li>Solicitar a portabilidade de seus dados</li>
                    <li>Obter informações sobre compartilhamento de dados</li>
                  </ul>
                </div>
              </div>

              {/* Contato */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold">6. Contato</h2>
                </div>
                <div className="space-y-4 text-muted-foreground pl-9">
                  <p>
                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                    entre em contato conosco:
                  </p>
                  <div className="card-elegant p-6">
                    <p><strong>Email:</strong> privacidade@elathosemijoias.com.br</p>
                    <p className="mt-2"><strong>WhatsApp:</strong> (11) 99999-9999</p>
                    <p className="mt-2"><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
              </div>

              {/* Cookies */}
              <div className="p-6 rounded-xl bg-champagne/30 border border-primary/20">
                <h3 className="font-semibold mb-2">Sobre Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas 
                  preferências e analisar o tráfego do site. Você pode gerenciar as preferências 
                  de cookies através das configurações do seu navegador.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
